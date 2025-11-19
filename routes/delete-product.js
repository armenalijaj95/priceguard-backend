import express from "express";
import { Product } from "../models/Product.js";

const router = express.Router();

router.delete("/:asin", async (req, res) => {
    try {
        const asin = req.params.asin;

        const product = await Product.findOneAndDelete({ asin });

        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        return res.json({ success: true, message: "Product deleted" });

    } catch (err) {
        console.error("Delete error:", err);
        res.json({ success: false, message: "Server error" });
    }
});

export default router;