import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import trackRoute from "./routes/track.js";
import checkPricesRoute from "./routes/check-prices.js"; // ✅ ADD THIS
import productsRoute from "./routes/products.js";
import deleteProductRoute from "./routes/delete-product.js";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { runPriceCheck } from "./cron/checkPrices.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static dashboard
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(cors());

// ✅ ROUTES
app.use("/api/track", trackRoute);
app.use("/api/check-prices", checkPricesRoute); // ✅ NOW IT WORKS
app.use("/api/products", productsRoute);
app.use("/api/delete", deleteProductRoute);
// Root for testing
app.get("/", (req, res) => {
    res.send("PriceGuard API is running");
});

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI, { dbName: "priceguard" })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB error:", err));

// Automatic cron job: run price check every 30 minutes
cron.schedule("*/30 * * * *", () => {
    console.log("⏱ Running scheduled multi-region price check...");
    runPriceCheck();
});

// PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 PriceGuard API running on port ${PORT}`);
});