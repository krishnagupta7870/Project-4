import mongoose from 'mongoose';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Report from '../models/Report.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dealmate");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const debugUser = async () => {
    await connectDB();

    // Find user roughly matching email
    const user = await User.findOne({ email: /kgusa121/i });

    if (!user) {
        console.log("User not found!");
        process.exit();
    }

    console.log(`User: ${user.email} (${user._id})`);
    console.log(`CreatedAt: ${user.createdAt}`);

    const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
    const daysOld = accountAgeMs / (1000 * 60 * 60 * 24);
    console.log(`Age in Days: ${daysOld}`);

    const products = await Product.find({ seller: user._id });
    console.log(`Products: ${products.length}`);

    const reviews = await Review.find({ seller: user._id });
    console.log(`Reviews: ${reviews.length}`);

    if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        console.log(`Avg Rating: ${avgRating}`);

        const totalSentiment = reviews.reduce((sum, r) => sum + (r.sentimentScore || 0.5), 0);
        const avgSentiment = totalSentiment / reviews.length;
        console.log(`Avg Sentiment: ${avgSentiment}`);

        console.log(`Calc Rating Pts: ${(avgRating / 4.5) * 35}`);
        console.log(`Calc Sentiment Pts: ${(avgSentiment / 0.85) * 35}`);
    }

    const reports = await Report.find({ targetId: user._id, reportType: 'user', status: { $ne: 'dismissed' } });
    console.log(`Reports: ${reports.length}`);

    process.exit();
};

debugUser();
