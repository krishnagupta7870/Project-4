import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Category from "../../models/Category.js";
import SubCategory from "../../models/SubCategory.js";
import { protect, adminOnly } from "../../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Helper to sync database categories back to the frontend config file
 * This fulfills the user's request to save changes back to categories.js
 */
const syncDBToFile = async () => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        const config = {};

        for (const cat of categories) {
            const subs = await SubCategory.find({ category: cat._id }).sort({ name: 1 });
            config[cat.name] = {
                subCategories: subs.reduce((acc, sub) => {
                    acc[sub.name] = {
                        fields: sub.fields || []
                    };
                    return acc;
                }, {})
            };
        }

        // Navigate to frontend config directory (3 levels up to reach DEALMATE root)
        const filePath = path.resolve(__dirname, "../../../frontend/src/config/categories.js");

        const fileContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY IF YOU WANT TO KEEP DB SYNC
 * This file is synced with the backend database.
 */

export const categoryConfig = ${JSON.stringify(config, null, 4)};

export const getAllCategories = () => Object.keys(categoryConfig);

export const getSubCategories = (category) => {
    return categoryConfig[category]?.subCategories ? Object.keys(categoryConfig[category].subCategories) : [];
};

export const getCategoryFields = (category, subCategory) => {
    return categoryConfig[category]?.subCategories?.[subCategory]?.fields || [];
};
`;

        fs.writeFileSync(filePath, fileContent);
        return true;
    } catch (err) {
        console.error("Sync to file error:", err);
        throw err;
    }
};

/**
 * POST /api/categories/seed
 * Seeds categories and subcategories from the provided data
 * Fixes: Uses case-insensitive matching to avoid duplicates
 */
router.post("/seed", protect, adminOnly, async (req, res) => {
    try {
        const { categoriesData } = req.body;

        if (!categoriesData || typeof categoriesData !== 'object') {
            return res.status(400).json({ message: "categoriesData object required" });
        }

        const results = {
            categoriesCreated: 0,
            subCategoriesCreated: 0,
            errors: []
        };

        console.log(`Starting seed with ${Object.keys(categoriesData).length} categories`);
        for (const categoryName of Object.keys(categoriesData)) {
            try {
                process.stdout.write(`Processing category: ${categoryName}... `);
                // Case-insensitive search
                let category = await Category.findOne({
                    name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
                });

                if (!category) {
                    category = await Category.create({ name: categoryName, image: "" });
                    results.categoriesCreated++;
                } else {
                    category.name = categoryName;
                    await category.save();
                }

                const catConfig = categoriesData[categoryName];

                if (catConfig.subCategories) {
                    for (const subCatName of Object.keys(catConfig.subCategories)) {
                        try {
                            const subConfig = catConfig.subCategories[subCatName];

                            let subCategory = await SubCategory.findOne({
                                name: { $regex: new RegExp(`^${subCatName}$`, 'i') },
                                category: category._id
                            });

                            if (!subCategory) {
                                subCategory = await SubCategory.create({
                                    name: subCatName,
                                    category: category._id,
                                    fields: subConfig.fields || []
                                });
                                results.subCategoriesCreated++;
                            } else {
                                subCategory.name = subCatName;
                                subCategory.fields = subConfig.fields || [];
                                await subCategory.save();
                            }
                        } catch (subErr) {
                            console.error(`\nError in subcat ${subCatName}:`, subErr.message);
                            results.errors.push(`Subcat ${subCatName}: ${subErr.message}`);
                        }
                    }
                }
                console.log("Done.");
            } catch (catErr) {
                console.error(`\nError in category ${categoryName}:`, catErr.message);
                results.errors.push(`Cat ${categoryName}: ${catErr.message}`);
            }
        }

        console.log("Seed processing complete.");
        // DISABLED auto-sync to file here to prevent overwriting user's manual JS structure (like commonFields)
        // await syncDBToFile(); 
        // console.log("Sync to file complete.");

        res.json({
            success: results.errors.length === 0,
            message: results.errors.length === 0 ? "Seed completed successfully" : "Seed completed with errors",
            ...results
        });
    } catch (err) {
        console.error("Seed error:", err);
        res.status(500).json({ message: "Seed failed", error: err.message });
    }
});

/**
 * POST /api/categories/sync-to-config
 * Manually trigger sync from DB to categories.js
 */
router.post("/sync-to-config", protect, adminOnly, async (req, res) => {
    try {
        await syncDBToFile();
        res.json({
            success: true,
            message: "Successfully synced DB to categories.js. NOTE: Custom JS variables like commonFields were replaced by flat JSON."
        });
    } catch (err) {
        res.status(500).json({ message: "Sync failed", error: err.message });
    }
});

/**
 * GET /api/categories/full
 * Returns full category structure for ListYourProduct
 */
router.get("/full", async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1, name: 1 });
        const subCategories = await SubCategory.find().sort({ order: 1, name: 1 });
        const fullStructure = {};

        for (const category of categories) {
            fullStructure[category.name] = {
                _id: category._id,
                subCategories: []
            };
        }

        for (const sub of subCategories) {
            const category = categories.find(c => c._id.toString() === sub.category.toString());
            if (category) {
                fullStructure[category.name].subCategories.push({
                    name: sub.name,
                    _id: sub._id,
                    fields: sub.fields || []
                });
            }
        }

        res.json(fullStructure);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch categories" });
    }
});

export default router;
