import { Product } from "../models/Product.js";
import { scrapeAmazonProduct } from "../utils/scraper.js";

export async function runPriceCheck() {
    console.log("🔎 Running automatic PriceGuard cron check...");

    try {
        const products = await Product.find({});
        console.log(`📦 Checking ${products.length} tracked products...`);

        for (const product of products) {
            console.log(`➡ Scraping multi-region for ASIN: ${product.asin}`);

            const scraped = await scrapeAmazonProduct(product.asin);
            const regions = Object.keys(scraped);

            for (const region of regions) {
                const data = scraped[region];

                const regionData = product.prices[region];

                // Ensure regionData exists
                if (!regionData) {
                    product.prices[region] = { price: null, currency: data.currency, history: [], available: null, shipping: null };
                }

                // Update availability & shipping
                if ("available" in data) product.prices[region].available = data.available;
                if ("shipping" in data) product.prices[region].shipping = data.shipping;

                // Update pricing only if found
                if (data.price !== null) {
                    const oldPrice = product.prices[region].price;
                    const newPrice = data.price;

                    product.prices[region].price = newPrice;
                    product.prices[region].currency = data.currency;

                    // Add to history only when changed
                    if (oldPrice !== newPrice) {
                        product.prices[region].history.push({
                            price: newPrice,
                            date: new Date()
                        });

                        console.log(`  🔄 ${region.toUpperCase()} price changed ${oldPrice} → ${newPrice}`);

                        // Reset notification flag so browser can notify again
                        if (product.notified && product.notified[region]) {
                            product.notified[region] = false;
                        }
                    }
                } else {
                    console.log(`  ⚠ ${region.toUpperCase()} unavailable or missing`);
                }
            }

            await product.save();
        }

        console.log("✅ Price check finished\n");
    } catch (err) {
        console.error("❌ Cron job error:", err);
    }
}