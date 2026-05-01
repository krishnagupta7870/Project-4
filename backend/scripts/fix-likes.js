import mongoose from 'mongoose';
import Product from '../models/Product.js';

// Connect to MongoDB
await mongoose.connect('mongodb://localhost:27017/dealmate');

async function fixLikesField() {
    try {
        // Update all products that don't have a likes field
        const result = await Product.updateMany(
            { likes: { $exists: false } },
            { $set: { likes: [] } }
        );

        console.log(`✅ Updated ${result.modifiedCount} products with empty likes array`);

        // Also convert any null values to empty arrays
        const result2 = await Product.updateMany(
            { likes: null },
            { $set: { likes: [] } }
        );

        console.log(`✅ Fixed ${result2.modifiedCount} products with null likes`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

fixLikesField();
