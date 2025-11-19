// routes/track.js
import express from "express";
import { Product } from "../models/Product.js";
import { scrapeAmazonProduct } from "../utils/scraper.js";

const router = express.Router();

// Map Amazon domains → region codes
const DOMAIN_TO_REGION = {
    "amazon.de": "de",
    "amazon.it": "it",
    "amazon.fr": "fr",
    "amazon.es": "es",
    "amazon.co.uk": "uk",
    "amazon.com": "us"
};

// Auto‑detect region from the URL
function detectRegionFromURL(url) {
    try {
        const host = new URL(url).hostname.replace("www.", "");
        return DOMAIN_TO_REGION[host] || "de";
    } catch {
        return "de";
    }
}

router.post("/", async (req, res) => {
    try {
        const { asin, url, title, image } = req.body;

        if (!asin) {
            return res.json({ success: false, error: "ASIN missing" });
        }

        const regionFromURL = detectRegionFromURL(url);
        console.log(`📌 Tracking request: ASIN ${asin} (from ${regionFromURL.toUpperCase()})`);

        // Load product if exists
        let product = await Product.findOne({ asin });

        // Scrape ALL Amazon regions (DE, IT, FR, ES, UK, US)
        const scrapedRegions = await scrapeAmazonProduct(asin);

        // If product does not exist, create a new document
        if (!product) {
            product = new Product({
                asin,
                title,
                url,
                image,
                prices: {},
                notified: {}
            });
        }

        // Update metadata always
        if (title) product.title = title;
        if (url) product.url = url;
        if (image) product.image = image;

        // Update each region's scraped data
        for (const region of Object.keys(scrapedRegions)) {
            const s = scrapedRegions[region];

            if (!product.prices[region]) {
                product.prices[region] = {
                    price: null,
                    currency: null,
                    raw: null,
                    availability: null,
                    shipping: null,
                    title: null,
                    image: null,
                    scrapedAt: null,
                    history: []
                };
            }

            const prevPrice = product.prices[region].price;
            const newPrice = s.price;

            product.prices[region].currency = s.currency;
            product.prices[region].raw = s.raw || null;
            product.prices[region].availability = s.availability || "Unknown";
            product.prices[region].shipping = s.shipping || "Unknown";

            product.prices[region].title = s.title || product.prices[region].title;
            product.prices[region].image = s.image || product.prices[region].image;
            product.prices[region].scrapedAt = s.scrapedAt || new Date();

            // If we got a valid price
            if (newPrice !== null) {
                product.prices[region].price = newPrice;

                if (prevPrice !== newPrice) {
                    product.prices[region].history.push({
                        price: newPrice,
                        date: new Date()
                    });

                    console.log(
                        `   💰 [${region.toUpperCase()}] price updated: ${prevPrice} → ${newPrice}`
                    );
                }
            } else {
                console.log(
                    `   ⚠ [${region.toUpperCase()}] No price (might be unavailable)`
                );
            }
        }

        product.updatedAt = new Date();
        await product.save();

        res.json({
            success: true,
            message: "Product tracked + all regions updated",
            product
        });

    } catch (err) {
        console.error("🔥 Track API Error:", err);
        res.json({ success: false, error: "Server error" });
    }
});

export default router;