import "dotenv/config.js";
import { connectDB } from "../db.js";
import { Product } from "../models/Product.js";
import { scrapeAmazonProduct } from "../utils/scraper.js";

await connectDB();
console.log("🔁 Running scheduled price check...");

async function checkPrices() {
    try {
        // Fetch ALL tracked products
        const products = await Product.find({});
        console.log(`📦 Checking ${products.length} products...`);

        for (const product of products) {
            console.log(`\n🔎 Checking ASIN ${product.asin} ...`);

            // Scrape fresh data
            const scraped = await scrapeAmazonProduct(product.url);
            if (!scraped || !scraped.price) {
                console.log(`⚠️ Could not scrape price for ${product.asin}`);
                continue;
            }

            const newPrice = parseFloat(scraped.price);
            const oldPrice = product.latestPrice ? parseFloat(product.latestPrice) : null;

            console.log(`💰 OLD: ${oldPrice} → NEW: ${newPrice}`);

            // FIRST TIME PRICE (initialPrice)
            if (product.initialPrice === null && !isNaN(newPrice)) {
                product.initialPrice = newPrice;
            }

            // PRICE HISTORY UPDATE
            if (!isNaN(newPrice)) {
                const lastEntry = product.history[product.history.length - 1];
                if (!lastEntry || lastEntry.price !== newPrice) {
                    product.history.push({
                        price: newPrice,
                        date: new Date()
                    });
                }
            }

            // UPDATE latest price
            product.latestPrice = newPrice;

            // PRICE DROP DETECTION
            if (
                oldPrice !== null &&
                !isNaN(oldPrice) &&
                newPrice < oldPrice
            ) {
                console.log(`📉 PRICE DROP detected for ${product.asin}!`);

                product.notified = false; // allow notification again

                product.lastDrop = {
                    old: oldPrice,
                    new: newPrice,
                    date: new Date()
                };
            }

            await product.save();
        }

        console.log("\n✅ Price check completed.");
        process.exit(0);

    } catch (err) {
        console.error("❌ checkPrices ERROR:", err);
        process.exit(1);
    }
}

checkPrices();