import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import Review from "../../models/Review.js";
import Product from "../../models/Product.js";
import { recordSearch } from "../../services/UserActivityService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const cleanJSONResponse = (text) => {
    return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

let sentimentLexicon = null;
let lexiconLoaded = false;
const datasetDir = process.env.DATASET_DIR || path.resolve(__dirname, "../../data/amazon_polarity");
const tokenize = (t) => (t || "").toLowerCase().split(/[^a-z]+/).filter(w => w.length > 2);
const parseLine = (line) => {
    const l = line.trim();
    if (!l) return null;
    let parts = [];
    if (l.startsWith('"')) {
        const idx = l.indexOf('","');
        if (idx > -1) {
            const label = l.slice(1, idx);
            const text = l.slice(idx + 3).replace(/(^"|"$)/g, "");
            parts = [label, text];
        }
    }
    if (parts.length === 0) {
        const firstComma = l.indexOf(",");
        if (firstComma === -1) return null;
        const label = l.slice(0, firstComma).replace(/"/g, "");
        const text = l.slice(firstComma + 1).replace(/^"+|"+$/g, "");
        parts = [label, text];
    }
    const label = (parts[0] || "").toLowerCase();
    const text = parts[1] || "";
    if (!text) return null;
    return { label, text };
};
const buildLexicon = (lines, limit = 100000) => {
    const pos = new Map();
    const neg = new Map();
    let count = 0;
    for (const line of lines) {
        if (count >= limit) break;
        const parsed = parseLine(line);
        if (!parsed) continue;
        const words = tokenize(parsed.text);
        const isPos = parsed.label.includes("pos");
        const isNeg = parsed.label.includes("neg");
        if (!isPos && !isNeg) continue;
        for (const w of words) {
            if (isPos) pos.set(w, (pos.get(w) || 0) + 1);
            if (isNeg) neg.set(w, (neg.get(w) || 0) + 1);
        }
        count++;
    }
    const lex = new Map();
    const allWords = new Set([...pos.keys(), ...neg.keys()]);
    for (const w of allWords) {
        const p = pos.get(w) || 0;
        const n = neg.get(w) || 0;
        const total = p + n;
        if (total === 0) continue;
        const score = (p - n) / total;
        lex.set(w, score);
    }
    return lex;
};
const ensureLexicon = () => {
    if (lexiconLoaded) return;
    try {
        const trainCsv = path.join(datasetDir, "train.csv");
        const testCsv = path.join(datasetDir, "test.csv");
        const trainCvs = path.join(datasetDir, "train.cvs");
        const testCvs = path.join(datasetDir, "test.cvs");
        let lines = [];
        if (fs.existsSync(trainCsv)) {
            const data = fs.readFileSync(trainCsv, "utf8");
            lines = lines.concat(data.split(/\r?\n/));
        } else if (fs.existsSync(trainCvs)) {
            const data = fs.readFileSync(trainCvs, "utf8");
            lines = lines.concat(data.split(/\r?\n/));
        }
        if (fs.existsSync(testCsv)) {
            const data = fs.readFileSync(testCsv, "utf8");
            lines = lines.concat(data.split(/\r?\n/));
        } else if (fs.existsSync(testCvs)) {
            const data = fs.readFileSync(testCvs, "utf8");
            lines = lines.concat(data.split(/\r?\n/));
        }
        if (lines.length > 0) {
            sentimentLexicon = buildLexicon(lines);
        } else {
            sentimentLexicon = new Map();
        }
    } catch {
        sentimentLexicon = new Map();
    } finally {
        lexiconLoaded = true;
    }
};
const lexiconScore = (text) => {
    ensureLexicon();
    if (!sentimentLexicon || sentimentLexicon.size === 0) return null;
    const words = tokenize(text);
    if (words.length === 0) return null;
    let sum = 0;
    let used = 0;
    for (const w of words) {
        if (sentimentLexicon.has(w)) {
            sum += sentimentLexicon.get(w);
            used++;
        }
    }
    if (used === 0) return null;
    return Math.max(-1, Math.min(1, sum / used));
};

const faqMap = {
    post_product: {
        title: "How to post a product",
        answer: "To post a product, log in and click on the Post Ad or Sell button, choose the correct category, add a clear title and detailed description, upload sharp photos from different angles, set a fair price, and publish the listing. Make sure the information is accurate and honest so buyers can trust you."
    },
    search_filters: {
        title: "How to search or use filters",
        answer: "Use the search bar on the homepage to type what you are looking for, then narrow results using filters like category, location, price range, condition, and more. You can also browse by category first, then apply filters to quickly find the most relevant products near you."
    },
    boost_product: {
        title: "How to boost a product",
        answer: "Boosting moves your ad higher in search and category results for a limited time. Go to your Seller panel or My Listings, pick the product you want to promote, choose a boost package, and complete payment. Once paid, your ad will get extra visibility until the boost time ends."
    },
    edit_delete: {
        title: "How to edit or delete a listing",
        answer: "To edit or delete a listing, open your My Listings or Seller panel, select the product, and choose Edit to update details like photos, price, or description. If the item is sold or no longer available, use the Delete or Mark as sold option so buyers stop contacting you about it."
    },
    safety_guidelines: {
        title: "Guidelines for safe transactions",
        answer: "Always meet in a public place, inspect the product carefully, and only pay after you are satisfied. Avoid sharing passwords, OTPs, or bank details, do not send advance payments to strangers, and keep your conversation inside DealMate chat so you can report any suspicious behavior."
    },
    general_faqs: {
        title: "General FAQs about DealMate",
        answer: "DealMate is a marketplace where people in Nepal can buy and sell items locally. You can browse products for free, post standard ads at no cost, and optionally boost listings for extra visibility. For more details about accounts, buying, selling, and safety, visit the Help Center or FAQs page."
    }
};

const normalizeKey = (value) => {
    if (!value) return "";
    return String(value).trim().toLowerCase();
};

const resolveFaqKey = (keyOrText) => {
    const v = normalizeKey(keyOrText);
    if (!v) return null;
    if (faqMap[v]) return v;
    if (v.includes("post") && v.includes("product")) return "post_product";
    if (v.includes("list") && (v.includes("product") || v.includes("item") || v.includes("ad"))) return "post_product";
    if (v.includes("search") || v.includes("filter")) return "search_filters";
    if (v.includes("boost") || v.includes("promote")) return "boost_product";
    if ((v.includes("edit") || v.includes("update") || v.includes("delete") || v.includes("remove")) && (v.includes("listing") || v.includes("ad") || v.includes("product"))) return "edit_delete";
    if (v.includes("safety") || v.includes("safe") || v.includes("transaction")) return "safety_guidelines";
    if (v.includes("faq") || v.includes("question") || v.includes("general") || v.includes("about dealmate")) return "general_faqs";
    return null;
};

const buildProductQuery = (fields) => {
    const query = { status: "active" };
    const and = [];
    const category = normalizeKey(fields.category);
    const brand = normalizeKey(fields.brand);
    const model = normalizeKey(fields.model);
    const storage = fields.storage;
    const minPrice = fields.minPrice;
    const maxPrice = fields.maxPrice;
    const keywords = Array.isArray(fields.keywords) ? fields.keywords : [];

    if (category) {
        and.push({
            $or: [
                { category: { $regex: category, $options: "i" } },
                { subCategory: { $regex: category, $options: "i" } },
                { thirdCategory: { $regex: category, $options: "i" } }
            ]
        });
    }

    const textConditions = [];
    if (model) {
        textConditions.push({ name: { $regex: model, $options: "i" } });
        textConditions.push({ description: { $regex: model, $options: "i" } });
        textConditions.push({ "specifications.model": { $regex: model, $options: "i" } });
    }
    if (storage) {
        const storageString = String(storage);
        textConditions.push({ name: { $regex: storageString, $options: "i" } });
        textConditions.push({ description: { $regex: storageString, $options: "i" } });
    }
    if (keywords.length > 0) {
        for (const kw of keywords) {
            const k = normalizeKey(kw);
            if (!k) continue;
            textConditions.push({ name: { $regex: k, $options: "i" } });
            textConditions.push({ description: { $regex: k, $options: "i" } });
            textConditions.push({ brand: { $regex: k, $options: "i" } });
            textConditions.push({ category: { $regex: k, $options: "i" } });
            textConditions.push({ subCategory: { $regex: k, $options: "i" } });
            textConditions.push({ thirdCategory: { $regex: k, $options: "i" } });
        }
    }
    if (textConditions.length > 0) {
        and.push({ $or: textConditions });
    }

    if (typeof minPrice === "number" || typeof maxPrice === "number") {
        const priceFilter = {};
        if (typeof minPrice === "number") {
            priceFilter.$gte = minPrice;
        }
        if (typeof maxPrice === "number") {
            priceFilter.$lte = maxPrice;
        }
        and.push({ price: priceFilter });
    }

    if (and.length > 0) {
        query.$and = and;
    }
    return query;
};

const scoreProductMatch = (product, fields) => {
    let score = 0;
    const categoryWeight = 0.4;
    const brandWeight = 0.3;
    const specWeight = 0.2;
    const priceWeight = 0.1;
    const category = normalizeKey(fields.category);
    const brand = normalizeKey(fields.brand);
    const model = normalizeKey(fields.model);
    const storage = fields.storage;
    const minPrice = fields.minPrice;
    const maxPrice = fields.maxPrice;
    if (category && product.category && normalizeKey(product.category) === category) {
        score += categoryWeight;
    }
    if (brand && product.brand && normalizeKey(product.brand) === brand) {
        score += brandWeight;
    }
    const textBlob = [
        product.name,
        product.description,
        product.specifications && product.specifications.model,
        product.specifications && product.specifications.storage
    ].filter(Boolean).join(" ").toLowerCase();
    let specScore = 0;
    let specParts = 0;
    if (model) {
        specParts += 1;
        if (textBlob.includes(model.toLowerCase())) {
            specScore += 1;
        }
    }
    if (storage) {
        specParts += 1;
        if (textBlob.includes(String(storage))) {
            specScore += 1;
        }
    }
    if (specParts > 0) {
        score += (specScore / specParts) * specWeight;
    }
    if (typeof product.price === "number" && (typeof minPrice === "number" || typeof maxPrice === "number")) {
        let target = null;
        if (typeof minPrice === "number" && typeof maxPrice === "number") {
            target = (minPrice + maxPrice) / 2;
        } else if (typeof maxPrice === "number") {
            target = maxPrice;
        } else if (typeof minPrice === "number") {
            target = minPrice;
        }
        if (target !== null && target > 0) {
            const diffRatio = Math.abs(product.price - target) / target;
            const priceScore = diffRatio >= 1 ? 0 : 1 - diffRatio;
            score += priceScore * priceWeight;
        }
    }
    const bounded = Math.max(0, Math.min(1, score));
    return Math.round(bounded * 100);
};

const simpleFallbackParse = (message) => {
    const lower = (message || "").toLowerCase();
    const filters = {
        category: null,
        subCategory: null,
        thirdCategory: null,
        brand: null,
        model: null,
        storage: null,
        minPrice: null,
        maxPrice: null,
        color: null,
        size: null,
        keywords: null,
        priceDirection: null
    };
    if (lower.includes("phone") || lower.includes("iphone") || lower.includes("mobile")) {
        filters.category = "mobile";
    } else if (lower.includes("bike") || lower.includes("bikes") || lower.includes("motorcycle") || lower.includes("motorbike") || lower.includes("scooter")) {
        filters.category = "bike";
    } else if (lower.includes("car") || lower.includes("suv") || lower.includes("jeep")) {
        filters.category = "car";
    } else if (lower.includes("laptop") || lower.includes("notebook")) {
        filters.category = "laptop";
    } else if (lower.includes("sofa") || lower.includes("chair") || lower.includes("table")) {
        filters.category = "furniture";
    }
    const priceMatch = lower.match(/(\d{4,7})/g);
    if (priceMatch && priceMatch.length > 0) {
        const nums = priceMatch.map(v => Number(v)).filter(v => !isNaN(v));
        if (nums.length === 1) {
            filters.maxPrice = nums[0];
            filters.priceDirection = "under";
        } else if (nums.length >= 2) {
            const sorted = nums.sort((a, b) => a - b);
            filters.minPrice = sorted[0];
            filters.maxPrice = sorted[sorted.length - 1];
            filters.priceDirection = "range";
        }
    }
    return {
        intent: "product_search",
        filters
    };
};

export const analyzeProductImage = async (req, res) => {
    try {
        // Support both single imagePath (legacy) and multiple imagePaths
        let paths = [];
        if (req.body.imagePaths) {
            paths = req.body.imagePaths;
        } else if (req.body.imagePath) {
            paths = [req.body.imagePath];
        }

        if (paths.length === 0) {
            return res.status(400).json({ message: "No images provided for analysis" });
        }

        // Prepare image parts for Gemini
        const imageParts = [];

        for (const imgPath of paths) {
            let buffer = null;
            let mimeType = "image/jpeg";

            if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
                try {
                    const response = await axios.get(imgPath, { responseType: "arraybuffer" });
                    buffer = Buffer.from(response.data);
                    const extFromUrl = path.extname(new URL(imgPath).pathname).toLowerCase();
                    if (extFromUrl === ".png") mimeType = "image/png";
                    if (extFromUrl === ".webp") mimeType = "image/webp";
                    if (extFromUrl === ".jpeg") mimeType = "image/jpeg";
                    if (extFromUrl === ".jpg") mimeType = "image/jpeg";
                } catch (err) {
                    continue;
                }
            } else {
                const relativePath = imgPath.replace(/^\//, "");
                const absolutePath = path.resolve(__dirname, "../../", relativePath);

                if (fs.existsSync(absolutePath)) {
                    buffer = fs.readFileSync(absolutePath);
                    const ext = path.extname(absolutePath).toLowerCase();
                    if (ext === ".png") mimeType = "image/png";
                    if (ext === ".webp") mimeType = "image/webp";
                    if (ext === ".jpeg") mimeType = "image/jpeg";
                    if (ext === ".jpg") mimeType = "image/jpeg";
                }
            }

            if (buffer) {
                const base64Image = buffer.toString("base64");
                imageParts.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: mimeType
                    }
                });
            }
        }

        if (imageParts.length === 0) {
            return res.status(404).json({ message: "Images not found on server" });
        }

        console.log(`AI Debug - Calling Gemini API with ${imageParts.length} images...`);
        // Using the user-specific model version found in their environment
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an AI assistant for a second-hand marketplace called DealMate.
      Your task is to analyze the product images and extract structured data to fill a listing form.
      
      Please identify:
      1. Category (Choose from: Mobiles, Electronics, Appliances, Vehicles, Furniture, Properties, Fashion, Sports, Toys, Other)
      2. Subcategory (Be precise, e.g., "Mobile Phones", "Laptops", "TVs", "Motorcycles", "Cars")
      3. Brand (e.g., Apple, Samsung, Honda, Bajaj, etc.)
      4. Name (A concise title for the product)
      5. Description (A short attractive description ~2 sentences)
      6. Specifications. Extract these specific keys based on category:
          - Mobiles/Laptops: "ram", "storage", "processor", "screenSize", "batteryHealth", "condition"
          - Vehicles: "model", "year" (estimate), "kmDriven" (estimate if visible, else null), "mileage", "owner", "condition" (New, Used, Good)
          - Furniture: "material", "type", "condition"
          - Appliances: "type", "capacity", "energyRating", "condition"
          - General: "color", "weight", "dimensions"

      Return ONLY a valid JSON object with this structure:
      {
        "name": "string",
        "description": "string",
        "category": "string",
        "subCategory": "string",
        "brand": "string",
        "specifications": {
            "model": "string",
            "year": "number",
            "condition": "string",
            "key": "value"
        }
      }
      Do not include any markdown formatting or explanations. Just the JSON.
    `;

        const result = await model.generateContent([
            prompt,
            ...imageParts
        ]);

        const responseText = result.response.text();
        console.log("AI Debug - Raw Response:", responseText);

        const cleanedText = cleanJSONResponse(responseText);
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("AI Debug - JSON Parse Error:", parseError);
            return res.status(500).json({ message: "AI returned invalid JSON", raw: responseText });
        }

        res.json(jsonResponse);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: "Failed to analyze images", error: error.message });
    }
};

export const analyzeSellerSentiment = async (req, res) => {
    try {
        const { sellerId } = req.params;
        if (!sellerId) return res.status(400).json({ message: "sellerId is required" });

        const reviews = await Review.find({ seller: sellerId })
            .sort({ createdAt: -1 })
            .limit(50)
            .select("rating comment createdAt");

        if (reviews.length === 0) {
            return res.json({
                totalReviews: 0,
                averageScore: 0,
                distribution: { positive: 0, neutral: 0, negative: 0 },
                details: []
            });
        }

        const model = process.env.GEMINI_API_KEY ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;
        const prompt = `Classify sentiment of the following text as positive, neutral, or negative. Return JSON: {"label":"positive|neutral|negative","score":number between -1 and 1}. Only JSON.`;

        const details = [];
        let positive = 0, neutral = 0, negative = 0, scoreSum = 0;

        for (const r of reviews) {
            const baseScore = Math.max(-1, Math.min(1, (r.rating - 3) / 2));
            let label = baseScore > 0.25 ? "positive" : baseScore < -0.25 ? "negative" : "neutral";
            let score = baseScore;

            if (model && r.comment) {
                try {
                    const result = await model.generateContent([prompt, r.comment]);
                    const responseText = result.response.text();
                    const cleaned = cleanJSONResponse(responseText);
                    const parsed = JSON.parse(cleaned);
                    if (typeof parsed.score === "number" && typeof parsed.label === "string") {
                        score = Math.max(-1, Math.min(1, parsed.score));
                        label = parsed.label.toLowerCase();
                    }
                } catch {}
            } else if (r.comment) {
                const ls = lexiconScore(r.comment);
                if (typeof ls === "number") {
                    score = Math.max(-1, Math.min(1, 0.5 * baseScore + 0.5 * ls));
                    label = score > 0.25 ? "positive" : score < -0.25 ? "negative" : "neutral";
                }
            }

            if (label === "positive") positive += 1;
            else if (label === "negative") negative += 1;
            else neutral += 1;
            scoreSum += score;

            details.push({
                rating: r.rating,
                comment: r.comment,
                sentimentLabel: label,
                sentimentScore: score,
                createdAt: r.createdAt
            });
        }

        const averageScore = scoreSum / reviews.length;
        res.json({
            totalReviews: reviews.length,
            averageScore,
            distribution: { positive, neutral, negative },
            details
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to analyze seller sentiment", error: error.message });
    }
};

export const chatbotAssistant = async (req, res) => {
    try {
        const { mode, message, faqKey, fieldsOverride } = req.body || {};
        if (!mode || (mode !== "faq" && mode !== "free")) {
            return res.status(400).json({ message: "mode must be 'faq' or 'free'" });
        }
        if (mode === "faq") {
            const resolvedKey = resolveFaqKey(faqKey || message);
            if (!resolvedKey || !faqMap[resolvedKey]) {
                return res.json({
                    type: "faq",
                    title: "Help",
                    answer: "I could not find a matching FAQ. You can ask your question in your own words or create a support ticket from the Help section."
                });
            }
            const faq = faqMap[resolvedKey];
            return res.json({
                type: "faq",
                key: resolvedKey,
                title: faq.title,
                answer: faq.answer
            });
        }
        if (!message || !String(message).trim()) {
            return res.status(400).json({ message: "message is required for free mode" });
        }
        let parsed = null;
        let usedGemini = false;
        const trimmed = String(message).trim();
        if (process.env.GEMINI_API_KEY) {
            try {
                console.log("AI Chatbot: using Gemini for query parsing");
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `
You are an assistant for a second-hand marketplace called DealMate.
Your task is to convert the user message into a compact JSON object for search.
Decide if the intent is "faq" or "product_search".
Only return JSON, no extra text.
Use null for unknown values.

Return JSON with this structure:
{
  "intent": "faq" | "product_search",
  "filters": {
    "category": string | null,
    "subCategory": string | null,
    "thirdCategory": string | null,
    "brand": string | null,
    "model": string | null,
    "storage": number | null,
    "color": string | null,
    "size": string | null,
    "keywords": string[] | null,
    "minPrice": number | null,
    "maxPrice": number | null,
    "priceDirection": "under" | "below" | "around" | "above" | "range" | null
  }
}

If the user clearly asks a price "under" or "below" X, set only maxPrice=X and priceDirection="under".
If they say "above" X, set only minPrice=X and priceDirection="above".
If they say "around" X, set minPrice and maxPrice as a reasonable range around X and priceDirection="around".
If they give a range (e.g. 1 lakh to 2 lakh), set both minPrice and maxPrice and priceDirection="range".
`;
                const result = await model.generateContent([
                    prompt,
                    trimmed
                ]);
                const responseText = result.response.text();
                const cleaned = cleanJSONResponse(responseText);
                parsed = JSON.parse(cleaned);
                usedGemini = true;
                console.log("AI Chatbot Gemini parsed filters:", parsed);
            } catch (err) {
                console.error("AI Chatbot Gemini error, falling back to text parser:", err?.message || err);
                parsed = simpleFallbackParse(trimmed);
            }
        } else {
            parsed = simpleFallbackParse(trimmed);
        }
        if (!parsed || typeof parsed !== "object") {
            parsed = simpleFallbackParse(trimmed);
            usedGemini = false;
        }
        let intent = parsed.intent === "faq" ? "faq" : "product_search";
        const filtersRaw = parsed && typeof parsed === "object"
            ? (parsed.filters && typeof parsed.filters === "object" ? parsed.filters : parsed)
            : {};
        const mergedFields = {
            category: filtersRaw.category ?? null,
            subCategory: filtersRaw.subCategory ?? null,
            thirdCategory: filtersRaw.thirdCategory ?? null,
            brand: filtersRaw.brand ?? null,
            model: filtersRaw.model ?? null,
            storage: typeof filtersRaw.storage === "number" ? filtersRaw.storage : null,
            minPrice: typeof filtersRaw.minPrice === "number" ? filtersRaw.minPrice : null,
            maxPrice: typeof filtersRaw.maxPrice === "number" ? filtersRaw.maxPrice : null,
            color: filtersRaw.color ?? null,
            size: filtersRaw.size ?? null,
            priceDirection: filtersRaw.priceDirection ?? null,
            ...(fieldsOverride || {})
        };
        const stopWords = new Set([
            "under",
            "below",
            "between",
            "around",
            "price",
            "prices",
            "cheap",
            "cheapest",
            "budget",
            "want",
            "needs",
            "need",
            "looking",
            "search",
            "for",
            "show",
            "find",
            "me",
            "with",
            "and",
            "or",
            "any",
            "color",
            "size"
        ]);
        const baseTokens = Array.from(
            new Set(
                (trimmed || "")
                    .toLowerCase()
                    .split(/[^a-z0-9]+/i)
                    .filter((w) => w && w.length >= 3 && !stopWords.has(w))
            )
        );
        const synonymTokens = [];
        if (baseTokens.some((t) => t.includes("bike"))) {
            synonymTokens.push("motorcycle", "motorcycles", "scooter", "scooters", "bike", "bikes");
        }
        if (baseTokens.some((t) => t.includes("motorcycle"))) {
            synonymTokens.push("bike", "bikes", "motorcycle", "motorcycles");
        }
        if (baseTokens.some((t) => t.includes("bicycle") || t.includes("cycle"))) {
            synonymTokens.push("bicycle", "bicycles", "cycle", "cycles");
        }
        if (baseTokens.some((t) => t.includes("iphone"))) {
            synonymTokens.push("iphone", "iphones", "apple");
        }
        let keywords = Array.isArray(filtersRaw.keywords) ? filtersRaw.keywords.slice() : [];
        const allTokens = Array.from(new Set([...(keywords || []), ...baseTokens, ...synonymTokens]));
        if (allTokens.length > 0) {
            mergedFields.keywords = allTokens;
        }
        const faqHeuristicKey = resolveFaqKey(trimmed);
        if (faqHeuristicKey) {
            intent = "faq";
        }
        const lowerMessage = (trimmed || "").toLowerCase();
        const hasUnder = lowerMessage.includes("under") || lowerMessage.includes("below");
        const hasBetween = lowerMessage.includes("between");
        if (hasBetween) {
            const numMatches = lowerMessage.match(/(\d+)\s*(lakh|lakhs|lac|lacs|k|thousand)?/g);
            if (numMatches && numMatches.length >= 2) {
                const extractValue = (token) => {
                    const m = token.match(/(\d+)\s*(lakh|lakhs|lac|lacs|k|thousand)?/);
                    if (!m) return null;
                    let v = Number(m[1]);
                    if (Number.isNaN(v)) return null;
                    const unit = m[2] || "";
                    if (/lakh|lac/i.test(unit)) v *= 100000;
                    else if (/k|thousand/i.test(unit)) v *= 1000;
                    return v;
                };
                const firstVal = extractValue(numMatches[0]);
                const secondVal = extractValue(numMatches[1]);
                if (typeof firstVal === "number" && typeof secondVal === "number") {
                    const lo = Math.min(firstVal, secondVal);
                    const hi = Math.max(firstVal, secondVal);
                    mergedFields.minPrice = lo;
                    mergedFields.maxPrice = hi;
                    mergedFields.priceDirection = "range";
                }
            }
        } else if (hasUnder) {
            const m = lowerMessage.match(/(\d+)\s*(lakh|lakhs|lac|lacs|k|thousand)?/);
            if (m) {
                let v = Number(m[1]);
                if (!Number.isNaN(v)) {
                    const unit = m[2] || "";
                    if (/lakh|lac/i.test(unit)) v *= 100000;
                    else if (/k|thousand/i.test(unit)) v *= 1000;
                    mergedFields.maxPrice = v;
                    if (typeof mergedFields.minPrice === "number" && mergedFields.minPrice > v) {
                        mergedFields.minPrice = null;
                    }
                    mergedFields.priceDirection = "under";
                }
            }
        }
        const normCategory = (mergedFields.category || "").toLowerCase();
        if (!mergedFields.category || normCategory === "bike" || normCategory === "bikes") {
            if (baseTokens.some((t) => t.includes("bike") || t.includes("motorcycle") || t.includes("scooter"))) {
                mergedFields.category = "Motorcycles";
            }
        }
        const normCategory2 = (mergedFields.category || "").toLowerCase();
        if (!mergedFields.category || normCategory2 === "bicycle" || normCategory2 === "bicycles" || normCategory2 === "cycle" || normCategory2 === "cycles") {
            if (baseTokens.some((t) => t.includes("bicycle") || t.includes("cycle"))) {
                mergedFields.category = "Bicycles";
            }
        }
        if (intent === "faq") {
            const resolvedKey = resolveFaqKey(trimmed);
            if (resolvedKey && faqMap[resolvedKey]) {
                const faq = faqMap[resolvedKey];
                return res.json({
                    type: "faq",
                    key: resolvedKey,
                    title: faq.title,
                    answer: faq.answer
                });
            }
            return res.json({
                type: "faq",
                title: "Help",
                answer: "This question looks like a general help request. Please check the FAQs or contact support from the Help section if you need more assistance."
            });
        }
        const query = buildProductQuery(mergedFields);
        let products = await Product.find(query).limit(50);
        if ((!products || products.length === 0) && (typeof mergedFields.minPrice === "number" || typeof mergedFields.maxPrice === "number")) {
            const widenedFields = { ...mergedFields };
            let target = null;
            if (typeof mergedFields.minPrice === "number" && typeof mergedFields.maxPrice === "number") {
                target = (mergedFields.minPrice + mergedFields.maxPrice) / 2;
            } else if (typeof mergedFields.maxPrice === "number") {
                target = mergedFields.maxPrice;
            } else if (typeof mergedFields.minPrice === "number") {
                target = mergedFields.minPrice;
            }
            if (target && target > 0) {
                const min = Math.floor(target * 0.7);
                const max = Math.ceil(target * 1.3);
                widenedFields.minPrice = min;
                widenedFields.maxPrice = max;
                const widenedQuery = buildProductQuery(widenedFields);
                products = await Product.find(widenedQuery).limit(50);
            }
        }
        if (!products || products.length === 0) {
            if (req.user) {
                recordSearch(req.user._id, {
                    source: "chatbot",
                    raw: trimmed,
                    filters: mergedFields
                }).catch(() => {});
            }
            return res.json({
                type: "product_search",
                query: mergedFields,
                products: [],
                message: "No products matched your request. Try adjusting your budget or keywords."
            });
        }
        const scored = products.map((p) => {
            const matchScore = scoreProductMatch(p, mergedFields);
            return {
                _id: p._id,
                name: p.name,
                price: p.price,
                category: p.category,
                brand: p.brand,
                image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
                matchScore
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
        if (req.user) {
            recordSearch(req.user._id, {
                source: "chatbot",
                raw: trimmed,
                filters: mergedFields
            }).catch(() => {});
        }
        return res.json({
            type: "product_search",
            query: mergedFields,
            products: scored
        });
    } catch (error) {
        return res.status(500).json({ message: "Chatbot failed to process the request", error: error.message });
    }
};
