import mongoose from 'mongoose';
import User from '../models/User.js';
import { calculateTrustScore } from '../services/TrustScoreService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dealmate");
        // console.log(`MongoDB Connected`);
    } catch (error) {
        process.exit(1);
    }
};

const debugCalculation = async () => {
    await connectDB();
    const user = await User.findOne({ email: /kgusa121/i });
    if (!user) { console.log('User not found'); process.exit(); }

    // console.log(`Calculating...`);
    try {
        const score = await calculateTrustScore(user._id);
        const freshUser = await User.findById(user._id);
        const stats = freshUser.sellerStats;

        console.log(`FINAL_SCORE: ${score}`);
        console.log(`RATING_POINTS: ${stats.ratingPoints}`);
        console.log(`REVIEW_POINTS: ${stats.reviewPoints}`);
        console.log(`REPORT_POINTS: ${stats.reportPoints}`);
        console.log(`CHAT_POINTS: ${stats.chatPoints}`);
        console.log(`SALES_POINTS: ${stats.soldPoints}`);
        console.log(`AVG_RATING: ${stats.avgRating || 'N/A'}`);
        console.log(`AVG_SENTIMENT: ${stats.avgSentimentScore || 'N/A'}`);
    } catch (e) {
        console.error(e);
    }
    process.exit();
};

debugCalculation();
