import "dotenv/config.js";
import { connectDB } from "../db.js";
import { Product } from "../models/Product.js";
import { scrapeAmazonProduct } from "../utils/scraper.js";

await connectDB();

console.log("🔁 Checking prices...");

async function checkPrices() {
    const products = await Product.find({});

    for (const product of products) {
        const data = await scrapeAmazonProduct(product.url);

        if (!data) continue;

        const { price } = data;

        console.log(`📉 ${product.asin} → ${price}`);

        product.history.push({ price });
        await product.save();
    }

    console.log("✅ All prices updated!");

    process.exit();
}

checkPrices();