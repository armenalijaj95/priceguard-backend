import express from "express";
import { Product } from "../models/Product.js";
import { scrapeAmazonProduct } from "../utils/scraper.js";

const router = express.Router();

/**
 * POST /api/check-prices
 * Re-scrapes ALL tracked products and returns changes
 */
router.post("/", async (req, res) => {
    try {
        console.log("🔍 Checking all product prices...");

        const products = await Product.find({});
        const results = [];

        for (const product of products) {
            const scraped = await scrapeAmazonProduct(product.asin);

            // If scraping failed → skip update
            if (!scraped || scraped.error) {
                results.push({
                    asin: product.asin,
                    title: product.title,
                    error: scraped?.error || "Scrape failed"
                });
                continue;
            }

            const newPrice = scraped.price ? parseFloat(scraped.price) : null;
            const oldPrice = parseFloat(product.latestPrice) || null;

            let priceChanged = false;
            let priceDropped = false;

            // Detect price changes
            if (newPrice !== null && oldPrice !== null) {
                priceChanged = newPrice !== oldPrice;
                priceDropped = newPrice < oldPrice;
            }

            // Update history when price changes
            if (priceChanged) {
                product.history.push({
                    price: newPrice,
                    date: new Date()
                });
            }

            // Update latest fields
            product.latestPrice = newPrice;
            product.title = scraped.title || product.title;
            product.image = scraped.image || product.image;

            // Reset "notified" flag only after a price increase
            if (!priceDropped) {
                product.notified = false;
            }

            await product.save();

            results.push({
                asin: product.asin,
                title: product.title,
                oldPrice,
                newPrice,
                priceChanged,
                priceDropped
            });
        }

        return res.json({
            success: true,
            message: "Prices checked",
            results
        });

    } catch (err) {
        console.error("❌ Price check error:", err);
        return res.json({
            success: false,
            error: "Server error"
        });
    }
});

export default router;