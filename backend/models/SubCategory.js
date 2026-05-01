import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    image: { type: String, default: "" },
    // Dynamic fields for this subcategory
    fields: {
      type: [{
        name: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, enum: ['text', 'number', 'select', 'textarea', 'file'], default: 'text' },
        placeholder: { type: String, default: "" },
        options: [String], // For select type
        required: { type: Boolean, default: false }
      }],
      default: []
    }
  },
  { timestamps: true }
);

// Add order field
subCategorySchema.add({ order: { type: Number, default: 0 } });

const SubCategory = mongoose.model("SubCategory", subCategorySchema);
export default SubCategory;
