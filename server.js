import "dotenv/config.js";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import trackRoute from "./routes/track.js";

const app = express();
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    next();
});
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
    res.send("PriceGuard API is running");
});

app.use("/api/track", trackRoute);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 PriceGuard API running on port ${PORT}`));