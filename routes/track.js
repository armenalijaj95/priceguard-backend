import express from "express";
import { Product } from "../models/Product.js";
import { scrapeAmazonProduct } from "../utils/scraper.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { asin, url, price, title, image } = req.body;

        if (!asin) return res.json({ error: "ASIN missing" });

        // Check if product exists
        let product = await Product.findOne({ asin });

        if (!product) {
            product = new Product({
                asin,
                url,
                title,
                image,
                history: []
            });
        }

        // Add price to history
        if (price) {
            product.history.push({ price });
        }

        await product.save();

        return res.json({
            success: true,
            message: "Product tracked",
            product
        });

    } catch (err) {
        console.error(err);
        res.json({ error: "Server error" });
    }
});

export default router;