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
    const { asin, url, displayedPrice, numericPrice, title, image } = req.body;

    const parsedPrice = parsePrice(displayedPrice);

    if (!asin) {
      return res.json({ success: false, error: "ASIN missing" });
    }

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
        initialPrice: numericPrice ?? parsedPrice ?? null,
        latestPrice: numericPrice ?? parsedPrice ?? null,
        notified: false,
        history: (numericPrice ?? parsedPrice) ? [{ price: numericPrice ?? parsedPrice, date: timestamp }] : []
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

    if (numericPrice ?? parsedPrice) {
      const newPrice = numericPrice ?? parsedPrice;
      product.latestPrice = newPrice;

      const last = product.history[product.history.length - 1];
      if (!last || last.price !== newPrice) {
        product.history.push({ price: newPrice, date: timestamp });
      }
    }

    // Detect price drop
    if (
      (numericPrice ?? parsedPrice) &&
      oldPrice &&
      (numericPrice ?? parsedPrice) < oldPrice
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