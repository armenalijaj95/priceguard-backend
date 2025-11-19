import express from "express";
import { Product } from "../models/Product.js";

const router = express.Router();

// Converts Amazon price formats into numeric values
function parsePrice(raw) {
  if (!raw) return null;

  return parseFloat(
    raw.toString()
      .replace(/[^\d,.]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

router.post("/", async (req, res) => {
  try {
    const { asin, url, price, title, image } = req.body;

    if (!asin) {
      return res.json({ success: false, error: "ASIN missing" });
    }

    const numericPrice = parsePrice(price);
    let product = await Product.findOne({ asin });

    let dropDetected = false;
    const timestamp = new Date();

    // CREATE NEW PRODUCT
    if (!product) {
      product = new Product({
        asin,
        url,
        title,
        image,
        initialPrice: numericPrice || null,
        latestPrice: numericPrice || null,
        notified: false,
        history: numericPrice ? [{ price: numericPrice, date: timestamp }] : []
      });

      await product.save();

      return res.json({
        success: true,
        dropDetected: false,
        message: "Product created & tracked",
        product
      });
    }

    // UPDATE EXISTING PRODUCT
    if (title) product.title = title;
    if (image) product.image = image;
    if (url) product.url = url;

    const oldPrice = product.latestPrice;

    if (numericPrice && !isNaN(numericPrice)) {
      product.latestPrice = numericPrice;

      // Add to price history if new price
      const last = product.history[product.history.length - 1];
      if (!last || last.price !== numericPrice) {
        product.history.push({ price: numericPrice, date: timestamp });
      }
    }

    // Detect price drop
    if (
      numericPrice &&
      oldPrice &&
      numericPrice < oldPrice
    ) {
      dropDetected = true;
      product.notified = false;
    }

    await product.save();

    return res.json({
      success: true,
      dropDetected,
      message: "Product updated",
      product
    });

  } catch (err) {
    console.error("Track API Error:", err);
    res.json({ success: false, error: "Server error" });
  }
});

export default router;