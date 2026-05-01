import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';
import Product from '../models/Product.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { analyzeSentiment } from '../utils/sentimentService.js';
import { calculateTrustScore } from '../services/TrustScoreService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
}

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to DB");

        console.log("--- 1. Migrating Reviews (Sentiment Analysis) ---");
        const reviews = await Review.find({});
        console.log(`Found ${reviews.length} reviews.`);

        for (const review of reviews) {
            if (review.sentimentScore === 0 && review.sentimentLabel === 'neutral') {
                // Only process if not likely already processed (default values)
                // Or force update if we want to ensure everything is fresh
                console.log(`Processing review ${review._id}...`);
                const sentiment = await analyzeSentiment(review.comment);
                review.sentimentScore = sentiment.score;
                review.sentimentLabel = sentiment.label;
                await review.save();
            }
        }
        console.log("Reviews updated.");

        console.log("--- 2. Migrating Reports (Sentiment Analysis) ---");
        const reports = await Report.find({});
        console.log(`Found ${reports.length} reports.`);

        for (const report of reports) {
            console.log(`Processing report ${report._id}...`);
            const sentiment = await analyzeSentiment(report.reason); // Analysis on 'reason'
            report.sentimentScore = sentiment.score;
            await report.save();
        }
        console.log("Reports updated.");

        console.log("--- 3. Recalculating Seller Trust Scores ---");
        // Only process sellers (users who have products)
        const allProducts = await Product.find({}).distinct('seller');
        const sellers = await User.find({ _id: { $in: allProducts } });
        console.log(`Found ${sellers.length} sellers (users with products).`);

        for (const seller of sellers) {
            console.log(`Calculating score for seller ${seller.name} (${seller._id})...`);
            try {
                const score = await calculateTrustScore(seller._id);
                console.log(`  -> New Score: ${score}`);
            } catch (err) {
                console.error(`  -> Failed for seller ${seller._id}:`, err.message);
            }
        }

        console.log("✅ Migration Complete!");
        process.exit(0);

    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
};

migrate();
