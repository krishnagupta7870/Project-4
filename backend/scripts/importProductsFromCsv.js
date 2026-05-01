import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Product from "../models/Product.js";
import User from "../models/User.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const csvPath = path.resolve(__dirname, "..", "seed", "products.csv");

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const parts = raw.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = parts[idx]));
    rows.push(obj);
  }
  return rows;
}

async function getSeller() {
  let seller = await User.findOne({ role: "seller" });
  if (!seller) seller = await User.findOne({ role: "admin" });
  if (!seller) {
    const hash = await bcrypt.hash("Demo@123", 10);
    seller = await User.create({
      name: "Demo Seller",
      email: `demo.seller@local.test`,
      password: hash,
      role: "seller",
      isVerified: true
    });
  }
  return seller;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const seller = await getSeller();
  await Product.deleteMany({});
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(text);
  const docs = rows.map((r) => ({
    name: r.name,
    description: r.description,
    brand: r.brand || undefined,
    price: Number(r.price),
    category: r.category,
    subCategory: r.subCategory || undefined,
    thirdCategory: r.thirdCategory || undefined,
    countInStock: Number(r.countInStock || 0),
    stock: Number(r.countInStock || 0),
    image: r.image,
    location: r.location || undefined,
    isActive: String(r.isActive || "true").toLowerCase() === "true",
    seller: seller._id,
    createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
  }));
  await Product.insertMany(docs);
  const count = await Product.countDocuments();
  console.log(`Inserted ${docs.length} products`);
  console.log(`Total products in database: ${count}`);
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
