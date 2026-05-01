import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../models/Review.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const fixSentiments = async () => {
    await connectDB();

    try {
        // Find 1-2 star reviews that are NOT negative
        const badReviews = await Review.find({
            rating: { $lte: 2 },
            sentimentLabel: { $ne: 'negative' }
        });

        console.log(`Found ${badReviews.length} 1-2 star reviews with incorrect sentiment.`);

        for (const review of badReviews) {
            console.log(`Fixing review: "${review.comment}" (Rating: ${review.rating}) - Was: ${review.sentimentLabel}`);
            review.sentimentLabel = 'negative';
            review.sentimentScore = 0.2; // Force low score
            await review.save();
        }

        // Find 4-5 star reviews that are NOT positive
        const goodReviews = await Review.find({
            rating: { $gte: 4 },
            sentimentLabel: { $ne: 'positive' }
        });

        console.log(`Found ${goodReviews.length} 4-5 star reviews with incorrect sentiment.`);

        for (const review of goodReviews) {
            console.log(`Fixing review: "${review.comment}" (Rating: ${review.rating}) - Was: ${review.sentimentLabel}`);
            review.sentimentLabel = 'positive';
            review.sentimentScore = 0.8; // Force high score
            await review.save();
        }

        console.log('Sentiment fix complete.');
        process.exit();
    } catch (error) {
        console.error('Error fixing sentiments:', error);
        process.exit(1);
    }
};

fixSentiments();
