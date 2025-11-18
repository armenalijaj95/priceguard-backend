import "dotenv/config.js";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import trackRoute from "./routes/track.js";

const app = express();
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
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