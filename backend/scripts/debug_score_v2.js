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
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const debugCalculation = async () => {
    await connectDB();
    const user = await User.findOne({ email: /kgusa121/i });
    if (!user) { console.log('User not found'); process.exit(); }

    console.log(`Calculating for ${user.email} (${user._id})`);
    try {
        const score = await calculateTrustScore(user._id);
        console.log(`SCORE RETURNED: ${score}`);
        // Fetch fresh user
        const freshUser = await User.findById(user._id);
        console.log(`DB Trust Score: ${freshUser.trustScore}`);
        console.log(`DB Stats: ${JSON.stringify(freshUser.sellerStats, null, 2)}`);
    } catch (e) {
        console.error(e);
    }
    process.exit();
};

debugCalculation();
