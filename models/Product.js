import mongoose from "mongoose";

const PriceSchema = new mongoose.Schema({
    price: Number,
    date: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
    asin: { type: String, required: true, unique: true },
    title: String,
    image: String,
    url: String,

    // NEW FIELDS
    initialPrice: { type: Number, default: null },
    latestPrice: { type: Number, default: null },
    notified: { type: Boolean, default: false },

    // PRICE HISTORY
    history: [PriceSchema]
});

export const Product = mongoose.model("Product", ProductSchema);