import mongoose from "mongoose";

const priceRegionSchema = new mongoose.Schema({
    price: { type: Number, default: null },
    currency: { type: String, default: null },
    availability: { type: String, default: null },
    shipping: { type: String, default: null },
    rawPrice: { type: String, default: null },
    history: [
        {
            price: Number,
            date: { type: Date, default: Date.now }
        }
    ]
});

const productSchema = new mongoose.Schema({
    asin: { type: String, required: true, unique: true },
    title: String,
    url: String,
    image: String,
    availability: { type: String, default: null },
    shipping: { type: String, default: null },

    // 🌍 Multi-region pricing (Amazon DE, IT, FR, ES, UK, US)
    prices: {
        de: { type: priceRegionSchema, default: () => ({}) },
        it: { type: priceRegionSchema, default: () => ({}) },
        fr: { type: priceRegionSchema, default: () => ({}) },
        es: { type: priceRegionSchema, default: () => ({}) },
        uk: { type: priceRegionSchema, default: () => ({}) },
        us: { type: priceRegionSchema, default: () => ({}) }
    },

    // 🛎 Notification flags per region
    notified: {
        de: { type: Boolean, default: false },
        it: { type: Boolean, default: false },
        fr: { type: Boolean, default: false },
        es: { type: Boolean, default: false },
        uk: { type: Boolean, default: false },
        us: { type: Boolean, default: false }
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Product = mongoose.model("Product", productSchema);