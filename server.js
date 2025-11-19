import "dotenv/config.js";
import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import trackRoute from "./routes/track.js";

const app = express();
app.use(cors({ origin: "*" }));

app.use(express.json());

connectDB();

app.get("/", (req, res) => {
    res.send("PriceGuard API is running");
});

app.use("/api", trackRoute);
app.use("/api/check-prices", checkPricesRoute);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 PriceGuard API running on port ${PORT}`));