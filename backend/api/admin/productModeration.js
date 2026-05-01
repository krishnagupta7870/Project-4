import Product from "../../models/Product.js";

/**
 * GET /api/admin/products/pending
 */
export const getPendingProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: "pending_approval" })
            .populate("seller", "name email")
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch pending products" });
    }
};

/**
 * PUT /api/admin/products/:id/approve
 */
export const approveProduct = async (req, res) => {
    try {
        const { status } = req.body; // 'active' or 'rejected'
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json({ message: `Product ${status} successfully`, product });
    } catch (err) {
        res.status(500).json({ message: "Failed to update product status" });
    }
};
