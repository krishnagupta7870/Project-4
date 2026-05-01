// backend/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import { setIo } from "./utils/socketManager.js";
import authRoutes from "./api/auth/authRoutes.js"; // make sure this path exists
import adminRoutes from "./api/admin/adminRoutes.js";
import productRoutes from "./api/products/productRoutes.js";
import orderRoutes from "./api/orders/orderRoutes.js";
import categoryRoutes from "./api/categories/categoryRoutes.js";
import subCategoryRoutes from "./api/subcategories/subCategoryRoutes.js";
import morgan from "morgan";
import testEmailRouter from './routes/testEmail.js';
import sellerVerificationRoutes from "./api/vendor/verificationSystem.js";
import uploadRoutes from "./api/uploadRoutes.js";
import wishlistRoutes from "./api/wishlist/wishlistRoutes.js";
import aiRoutes from "./api/ai/aiRoutes.js";
import notificationRoutes from "./api/notifications/notificationRoutes.js";
import paymentRoutes from "./api/payment/paymentRoutes.js";
import chatRoutes from "./api/chat/chatRoutes.js";
import userRoutes from "./api/users/userRoutes.js";
import reviewRoutes from "./api/products/reviewRoutes.js";
import reportRoutes from "./api/reports/reportRoutes.js";
import supportRoutes from "./api/support/supportRoutes.js";
import recommendationRoutes from "./api/products/recommendationRoutes.js";
import activityRoutes from "./api/activity/activityRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env (explicit path helps when nodemon runs from different cwd)
dotenv.config({ path: path.join(__dirname, ".env") });

// Quick env sanity checks
const { MONGO_URI, PORT = 5000, FRONTEND_URL = "http://localhost:3000" } = process.env;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set in .env. Please set it and restart.");
  process.exit(1);
}

console.log("📁 Working Directory:", process.cwd());
console.log("🔍 .env Loaded From:", path.join(__dirname, ".env"));
console.log("🔐 MONGO_URI:", MONGO_URI ? "FOUND ✅" : "❌ NOT FOUND");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  socket.on("join_room", (room) => {
    socket.join(room);
  });
});

app.set("io", io);
setIo(io);
// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || FRONTEND_URL, // restrict to frontend in production
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // request logging (install morgan if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files
app.use('/api', testEmailRouter);
app.use("/api/vendor/verification", sellerVerificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/activity", activityRoutes);


// Mount API routes (do this before server start)
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);

// Basic health & API root endpoints
app.get("/", (req, res) => res.send("Backend is running!"));
app.get("/api", (req, res) => res.json({ message: "API running" }));

// Central error handler (simple)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

// Start function: connect DB then listen
async function startServer() {
  try {
    // Connect to MongoDB (Mongoose v7+ default options are fine)
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");

    // Log connection state changes
    mongoose.connection.on("connected", () => console.log("Mongoose: connected"));
    mongoose.connection.on("error", (err) => console.error("Mongoose connection error:", err));
    mongoose.connection.on("disconnected", () => console.log("Mongoose: disconnected"));

    const server = httpServer.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("🛑 Shutting down server...");
      server.close(async (err) => {
        if (err) {
          console.error("Error closing server:", err);
          process.exit(1);
        }
        try {
          await mongoose.disconnect();
          console.log("MongoDB disconnected. Bye.");
          process.exit(0);
        } catch (e) {
          console.error("Error during mongoose.disconnect()", e);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (err) {
    console.error("❌ Server start failed:", err);
    process.exit(1); // nodemon will restart after you fix the issue
  }
}

startServer();
