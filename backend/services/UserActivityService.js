import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import ProductView from "../models/ProductView.js";
import UserActivityProfile from "../models/UserActivityProfile.js";

const MAX_SEARCH_HISTORY = 50;
const MAX_SIMILAR_USERS = 20;

function ensurePositiveNumber(value, fallback) {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}

async function getOrCreateProfile(userId) {
  if (!mongoose.isValidObjectId(userId)) return null;
  let profile = await UserActivityProfile.findOne({ user: userId });
  if (!profile) {
    const user = await User.findById(userId);
    if (!user) return null;
    profile = new UserActivityProfile({ user: user._id });
  }
  return profile;
}

function findOrCreateEntry(list, key, value) {
  let entry = list.find((item) => String(item[key]) === String(value));
  if (!entry) {
    entry = { [key]: value, score: 0, totalMs: 0, views: 0, interactions: 0, chats: 0 };
    list.push(entry);
  }
  return entry;
}

export async function recordProductViewDuration(userId, productId, durationMs) {
  const validDuration = ensurePositiveNumber(durationMs, 0);
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
    return;
  }
  if (validDuration <= 0) return;

  const cappedDuration = Math.min(validDuration, 10 * 60 * 1000);
  const product = await Product.findById(productId).select(
    "category subCategory brand seller"
  );
  if (!product) return;

  if (String(product.seller) === String(userId)) {
    return;
  }

  const profile = await getOrCreateProfile(userId);
  if (!profile) return;

  const durationEntry = findOrCreateEntry(
    profile.productDurations,
    "product",
    product._id
  );
  durationEntry.totalMs = ensurePositiveNumber(
    durationEntry.totalMs,
    0
  ) + cappedDuration;
  durationEntry.views = ensurePositiveNumber(durationEntry.views, 0) + 1;

  const seconds = cappedDuration / 1000;
  const weight = seconds < 5 ? 0.5 : seconds < 20 ? 1 : seconds < 60 ? 2 : 3;

  if (product.category) {
    const catEntry = findOrCreateEntry(
      profile.categoryStats,
      "category",
      product.category
    );
    catEntry.score = ensurePositiveNumber(catEntry.score, 0) + weight;
  }
  if (product.subCategory) {
    const subEntry = findOrCreateEntry(
      profile.subCategoryStats,
      "subCategory",
      product.subCategory
    );
    subEntry.score = ensurePositiveNumber(subEntry.score, 0) + weight;
  }
  if (product.brand) {
    const brandEntry = findOrCreateEntry(
      profile.brandStats,
      "brand",
      product.brand
    );
    brandEntry.score = ensurePositiveNumber(brandEntry.score, 0) + weight;
  }

  if (product.seller) {
    const sellerEntry = findOrCreateEntry(
      profile.sellerStats,
      "seller",
      product.seller
    );
    sellerEntry.interactions = ensurePositiveNumber(
      sellerEntry.interactions,
      0
    ) + 1;
  }

  profile.updatedAt = new Date();
  await profile.save();
}

export async function recordSearch(userId, payload) {
  if (!mongoose.isValidObjectId(userId)) return;
  const profile = await getOrCreateProfile(userId);
  if (!profile) return;

  let entry = null;
  let filters = null;

  if (typeof payload === "string") {
    const trimmed = String(payload || "").trim();
    if (!trimmed) return;
    entry = {
      source: "legacy",
      raw: trimmed,
      filters: null,
      timestamp: new Date()
    };
  } else if (payload && typeof payload === "object") {
    const source = String(payload.source || "unknown").trim();
    const raw = String(payload.raw || "").trim();
    if (!source && !raw && !payload.filters) return;
    filters = payload.filters || null;
    entry = {
      source: source || "unknown",
      raw: raw || null,
      filters,
      timestamp: new Date()
    };
  } else {
    return;
  }

  // KEYWORD EXTRACTION: If no filters, try to guess category from raw text
  if (!filters) {
    const rawText = (entry.raw || "").toLowerCase();
    const mapping = {
      "tv": "Electronics", "television": "Electronics", "led": "Electronics",
      "laptop": "Electronics", "computer": "Electronics", "pc": "Electronics",
      "earbuds": "Electronics", "headphones": "Electronics", "airpods": "Electronics",
      "buds": "Electronics", "watch": "Electronics", "smartwatch": "Electronics",
      "camera": "Electronics", "dslr": "Electronics",
      "phone": "Mobiles", "mobile": "Mobiles", "iphone": "Mobiles", "samsung": "Mobiles",
      "car": "Vehicles", "bike": "Vehicles", "scooter": "Vehicles", "motorcycle": "Vehicles",
      "washing machine": "Home Appliances", "fridge": "Home Appliances", "refrigerator": "Home Appliances", "ac": "Home Appliances",
      "sofa": "Furniture", "bed": "Furniture", "table": "Furniture",
      "shirt": "Fashion", "pant": "Fashion", "shoes": "Fashion", "sneakers": "Fashion", "clothing": "Fashion",
      "book": "Books & Sports", "football": "Books & Sports", "gym": "Books & Sports"
    };

    for (const [kw, cat] of Object.entries(mapping)) {
      if (rawText.includes(kw)) {
        filters = { category: cat };
        entry.filters = filters; // Update entry as well
        console.log(`[ActivityService] Extracted category "${cat}" from raw text: "${rawText}"`);
        break;
      }
    }
  }

  profile.searchHistory.push(entry);

  if (profile.searchHistory.length > MAX_SEARCH_HISTORY) {
    profile.searchHistory = profile.searchHistory.slice(
      profile.searchHistory.length - MAX_SEARCH_HISTORY
    );
  }

  const weight = 0.5;
  if (filters && typeof filters === "object") {
    const cat = filters.category || filters.categoryName || null;
    const sub = filters.subCategory || null;
    const brand = filters.brand || null;

    if (cat) {
      const catEntry = findOrCreateEntry(
        profile.categoryStats,
        "category",
        cat
      );
      catEntry.score = ensurePositiveNumber(catEntry.score, 0) + weight;
    }
    if (sub) {
      const subEntry = findOrCreateEntry(
        profile.subCategoryStats,
        "subCategory",
        sub
      );
      subEntry.score = ensurePositiveNumber(subEntry.score, 0) + weight;
    }
    if (brand) {
      const brandEntry = findOrCreateEntry(
        profile.brandStats,
        "brand",
        brand
      );
      brandEntry.score = ensurePositiveNumber(brandEntry.score, 0) + weight;
    }
  }

  profile.updatedAt = new Date();
  await profile.save();
}

export async function recordLikeEvent(userId, productId, liked) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
    return;
  }
  const product = await Product.findById(productId).select(
    "category subCategory brand seller"
  );
  if (!product) return;

  if (String(product.seller) === String(userId)) {
    return;
  }

  const profile = await getOrCreateProfile(userId);
  if (!profile) return;

  const delta = liked ? 5 : -2;

  if (product.category) {
    const catEntry = findOrCreateEntry(
      profile.categoryStats,
      "category",
      product.category
    );
    catEntry.score = ensurePositiveNumber(catEntry.score, 0) + delta;
  }
  if (product.subCategory) {
    const subEntry = findOrCreateEntry(
      profile.subCategoryStats,
      "subCategory",
      product.subCategory
    );
    subEntry.score = ensurePositiveNumber(subEntry.score, 0) + delta;
  }
  if (product.brand) {
    const brandEntry = findOrCreateEntry(
      profile.brandStats,
      "brand",
      product.brand
    );
    brandEntry.score = ensurePositiveNumber(brandEntry.score, 0) + delta;
  }

  if (product.seller && liked) {
    const sellerEntry = findOrCreateEntry(
      profile.sellerStats,
      "seller",
      product.seller
    );
    sellerEntry.interactions = ensurePositiveNumber(
      sellerEntry.interactions,
      0
    ) + 1;
  }

  profile.updatedAt = new Date();
  await profile.save();
}

export async function recordReviewSignal(userId, productId, sentimentScore) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
    return;
  }
  const product = await Product.findById(productId).select(
    "category subCategory brand seller"
  );
  if (!product) return;
  if (String(product.seller) === String(userId)) {
    return;
  }

  const profile = await getOrCreateProfile(userId);
  if (!profile) return;

  const score = typeof sentimentScore === "number" ? sentimentScore : 0;
  let delta = 0;
  if (score > 0.25) {
    delta = 1;
  } else if (score < -0.25) {
    delta = -1;
  }

  if (!delta || !product.seller) {
    return;
  }

  const sellerEntry = findOrCreateEntry(
    profile.sellerStats,
    "seller",
    product.seller
  );
  sellerEntry.interactions = ensurePositiveNumber(
    sellerEntry.interactions,
    0
  ) + delta;

  profile.updatedAt = new Date();
  await profile.save();
}

export async function recordSellerChatInteraction(buyerId, sellerId) {
  if (!mongoose.isValidObjectId(buyerId) || !mongoose.isValidObjectId(sellerId)) {
    return;
  }
  const profile = await getOrCreateProfile(buyerId);
  if (!profile) return;

  const sellerEntry = findOrCreateEntry(
    profile.sellerStats,
    "seller",
    sellerId
  );
  sellerEntry.interactions = ensurePositiveNumber(sellerEntry.interactions, 0) + 1;
  sellerEntry.chats = ensurePositiveNumber(sellerEntry.chats, 0) + 1;

  profile.updatedAt = new Date();
  await profile.save();
}

export async function rebuildSimilarUsers(userId) {
  if (!mongoose.isValidObjectId(userId)) return null;

  const user = await User.findById(userId).select("wishlist");
  if (!user) return null;

  const recentViews = await ProductView.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(100)
    .select("product")
    .lean();

  const interestIds = new Set([
    ...(user.wishlist || []).map((id) => String(id)),
    ...recentViews.map((v) => String(v.product))
  ]);

  const profileForDurations = await getOrCreateProfile(userId);
  if (profileForDurations && Array.isArray(profileForDurations.productDurations)) {
    for (const d of profileForDurations.productDurations) {
      const pid = d?.product;
      if (pid) {
        interestIds.add(String(pid));
      }
    }
  }

  if (!interestIds.size) {
    const profile = await getOrCreateProfile(userId);
    if (!profile) return null;
    profile.similarUsers = [];
    profile.updatedAt = new Date();
    await profile.save();
    return profile;
  }

  const interestArray = Array.from(interestIds);

  const products = await Product.find({ _id: { $in: interestArray } })
    .select("likes")
    .lean();

  const similarityMap = new Map();

  for (const p of products) {
    const likes = Array.isArray(p.likes) ? p.likes : [];
    for (const uid of likes) {
      const idStr = String(uid);
      if (idStr === String(userId)) continue;
      const prev = similarityMap.get(idStr) || 0;
      similarityMap.set(idStr, prev + 1);
    }
  }

  const recentViewDocs = await ProductView.find({
    product: { $in: interestArray }
  })
    .select("user product")
    .lean();

  for (const v of recentViewDocs) {
    const otherId = String(v.user);
    if (!otherId || otherId === String(userId)) continue;
    const prev = similarityMap.get(otherId) || 0;
    similarityMap.set(otherId, prev + 0.5);
  }

  if (!similarityMap.size) {
    const profile = await getOrCreateProfile(userId);
    if (!profile) return null;
    profile.similarUsers = [];
    profile.updatedAt = new Date();
    await profile.save();
    return profile;
  }

  const candidates = [];
  for (const [otherId, score] of similarityMap.entries()) {
    candidates.push({ user: otherId, score });
  }

  candidates.sort((a, b) => b.score - a.score);

  const top = candidates.slice(0, MAX_SIMILAR_USERS);

  const profile = await getOrCreateProfile(userId);
  if (!profile) return null;

  profile.similarUsers = top.map((c) => ({
    user: new mongoose.Types.ObjectId(c.user),
    score: c.score
  }));
  profile.updatedAt = new Date();

  await profile.save();
  return profile;
}

export async function getCollaborativeRecommendations(userId, limit = 10) {
  if (!mongoose.isValidObjectId(userId)) return [];

  const profile = await rebuildSimilarUsers(userId);
  if (!profile || !profile.similarUsers || !profile.similarUsers.length) {
    return [];
  }

  const similarUsers = profile.similarUsers;
  const similarIds = similarUsers.map((s) => s.user);

  const users = await User.find({ _id: { $in: similarIds } }).select(
    "wishlist"
  );

  const interestCount = new Map();

  for (const entry of similarUsers) {
    const userDoc = users.find(
      (u) => String(u._id) === String(entry.user)
    );
    if (!userDoc) continue;
    const weight = entry.score || 0;
    const liked = Array.isArray(userDoc.wishlist) ? userDoc.wishlist : [];
    for (const pid of liked) {
      const idStr = String(pid);
      const prev = interestCount.get(idStr) || 0;
      interestCount.set(idStr, prev + weight);
    }
  }

  if (!interestCount.size) return [];

  const currentUser = await User.findById(userId).select("wishlist");
  const excludedIds = new Set(
    (currentUser?.wishlist || []).map((id) => String(id))
  );

  const scoredProducts = [];
  for (const [pid, score] of interestCount.entries()) {
    if (excludedIds.has(pid)) continue;
    scoredProducts.push({ productId: pid, score });
  }

  scoredProducts.sort((a, b) => b.score - a.score);

  const topIds = scoredProducts.slice(0, limit).map((p) => p.productId);
  if (!topIds.length) return [];

  const products = await Product.find({
    _id: { $in: topIds },
    status: "active"
  }).lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));

  const ordered = [];
  for (const id of topIds) {
    const p = byId.get(String(id));
    if (p) ordered.push(p);
  }

  return ordered;
}

export async function recordClick(userId, productId) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(productId)) {
    return;
  }

  const product = await Product.findById(productId).select("category");
  if (!product) return;

  const profile = await getOrCreateProfile(userId);
  if (!profile) return;

  // 1. Record the Instant Intent (Click)
  profile.recentClicks.push({
    product: productId,
    category: product.category,
    timestamp: new Date()
  });

  // Limit recent clicks to top 10
  if (profile.recentClicks.length > 10) {
    profile.recentClicks = profile.recentClicks.slice(-10);
  }

  // 2. Also give a small incremental boost to the category interest
  if (product.category) {
    const catEntry = findOrCreateEntry(
      profile.categoryStats,
      "category",
      product.category
    );
    catEntry.score = (catEntry.score || 0) + 1; // +1 per click
  }

  profile.updatedAt = new Date();
  await profile.save();
}
