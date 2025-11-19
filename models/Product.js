import mongoose from "mongoose";

const PriceSchema = new mongoose.Schema({
    price: Number,
    display: String,
    date: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
    asin: { type: String, required: true, unique: true },
    title: String,
    image: String,
    url: String,

    // NEW FIELDS
    initialPrice: { type: Number, default: null },
    initialPriceDisplay: { type: String, default: null },
    latestPrice: { type: Number, default: null },
    latestPriceDisplay: { type: String, default: null },
    notified: { type: Boolean, default: false },

    // PRICE HISTORY
    history: [PriceSchema]
});

export const Product = mongoose.model("Product", ProductSchema);