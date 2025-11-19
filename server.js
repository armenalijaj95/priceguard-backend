import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import trackRoute from "./routes/track.js";
import checkPricesRoute from "./routes/check-prices.js"; // ✅ ADD THIS
import productsRoute from "./routes/products.js";

const app = express();

app.use(express.json());
app.use(cors());

// ✅ ROUTES
app.use("/api/track", trackRoute);
app.use("/api/check-prices", checkPricesRoute); // ✅ NOW IT WORKS
app.use("/api/products", productsRoute);
// Root for testing
app.get("/", (req, res) => {
    res.send("PriceGuard API is running");
});

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI, { dbName: "priceguard" })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB error:", err));

// PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 PriceGuard API running on port ${PORT}`);
});