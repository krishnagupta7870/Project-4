import mongoose from 'mongoose';
import User from '../models/User.js';
import Review from '../models/Review.js';
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

const dumpUser = async () => {
    await connectDB();
    const user = await User.findOne({ email: /kgusa121/i });
    if (!user) { console.log('User not found'); process.exit(); }

    console.log(`User ID: ${user._id}`);

    const reviews = await Review.find({ seller: user._id });
    console.log(`\nREVIEWS (${reviews.length}):`);
    reviews.forEach((r, i) => {
        console.log(`  ${i + 1}. Rating: ${r.rating}, Sentiment: ${r.sentimentScore} (${r.sentimentLabel})`);
    });

    const reports = await Report.find({ targetId: user._id });
    console.log(`\nUSER REPORTS (${reports.length}):`);
    reports.forEach((r, i) => {
        console.log(`  ${i + 1}. Type: ${r.reportType}, Reason: ${r.reason}, Status: "${r.status}", Sentiment: ${r.sentimentScore}`);
    });

    process.exit();
};

dumpUser();
