import mongoose from "mongoose";

const userActivityProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    productDurations: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        totalMs: {
          type: Number,
          default: 0
        },
        views: {
          type: Number,
          default: 0
        }
      }
    ],
    recentClicks: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        category: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    searchHistory: [
      {
        source: {
          type: String,
          trim: true
        },
        raw: {
          type: String,
          trim: true
        },
        filters: {
          type: mongoose.Schema.Types.Mixed
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    categoryStats: [
      {
        category: {
          type: String,
          trim: true
        },
        score: {
          type: Number,
          default: 0
        }
      }
    ],
    subCategoryStats: [
      {
        subCategory: {
          type: String,
          trim: true
        },
        score: {
          type: Number,
          default: 0
        }
      }
    ],
    brandStats: [
      {
        brand: {
          type: String,
          trim: true
        },
        score: {
          type: Number,
          default: 0
        }
      }
    ],
    sellerStats: [
      {
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        interactions: {
          type: Number,
          default: 0
        },
        chats: {
          type: Number,
          default: 0
        }
      }
    ],
    similarUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        score: {
          type: Number,
          default: 0
        }
      }
    ],
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

userActivityProfileSchema.index({ user: 1 });

const UserActivityProfile = mongoose.model(
  "UserActivityProfile",
  userActivityProfileSchema
);

export default UserActivityProfile;

