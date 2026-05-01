
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductView from './backend/models/ProductView.js';
import Product from './backend/models/Product.js';

dotenv.config({ path: './backend/.env' });

async function checkViews() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Since I don't have the user ID from the user, I'll search for recent views in general
    const recentViews = await ProductView.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('product', 'name category')
        .lean();

    console.log('Recent 10 views in the system:');
    recentViews.forEach(v => {
        console.log(`${v.timestamp.toISOString()} - Product: ${v.product?.name} (${v.product?.category}) - User: ${v.user}`);
    });

    process.exit(0);
}

checkViews();
