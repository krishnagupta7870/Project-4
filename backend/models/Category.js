import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    image: { type: String, default: "" },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;
