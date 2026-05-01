import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        reportType: {
            type: String,
            enum: ["product", "user", "other"],
            required: true
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId, // Can be Product ID or User ID
            required: true
        },
        reason: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved", "dismissed"],
            default: "pending"
        },
        adminComment: {
            type: String
        },
        sentimentScore: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
