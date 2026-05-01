import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { calculateTrustScore } from '../services/TrustScoreService.js';
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

const recalculateAll = async () => {
    await connectDB();

    console.log("Fetching all users...");
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        console.log(`Recalculating for ${user.email} (${user._id})...`);
        const score = await calculateTrustScore(user._id);
        console.log(`  -> New Score: ${score}`);
    }

    console.log("Done!");
    process.exit();
};

recalculateAll();
