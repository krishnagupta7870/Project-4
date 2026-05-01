import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
};

const setMixed = async () => {
    await connectDB();
    // Find the most recent review
    const review = await Review.findOne().sort({ createdAt: -1 });
    if (review) {
        console.log(`Setting review "${review.comment}" to MIXED`);
        review.sentimentLabel = 'mixed';
        review.save();
    }
    process.exit();
};

setMixed();
