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
    history: [PriceSchema]
});

export const Product = mongoose.model("Product", ProductSchema);