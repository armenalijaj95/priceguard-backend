import express from "express";
import { Product } from "../models/Product.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({ updatedAt: -1 });
        return res.json({ success: true, products });
    } catch (err) {
        console.error("Get Products Error:", err);
        return res.json({ success: false, error: "Server error" });
    }
});

export default router;