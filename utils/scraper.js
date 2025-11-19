import axios from "axios";
import * as cheerio from "cheerio";

// 🌍 Amazon base URLs per region
const REGION_URLS = {
    de: "https://www.amazon.de/dp/",
    it: "https://www.amazon.it/dp/",
    fr: "https://www.amazon.fr/dp/",
    es: "https://www.amazon.es/dp/",
    uk: "https://www.amazon.co.uk/dp/",
    us: "https://www.amazon.com/dp/"
};

// 🌍 Currency symbols
const CURRENCY_MAP = {
    de: "€",
    it: "€",
    fr: "€",
    es: "€",
    uk: "£",
    us: "$"
};

// ⭐ Normalize price “29,99 €” → 29.99
function normalizePrice(text) {
    if (!text) return null;

    return Number(
        text
            .replace(/[^\d.,]/g, "") 
            .replace(/\./g, "")     
            .replace(",", ".")      
    );
}

// ⭐ Helper: read first valid selector
function pickFirst($, selectors) {
    for (const sel of selectors) {
        const el = $(sel).first();
        if (el && el.text().trim()) return el.text().trim();
    }
    return null;
}

// ⭐ Extract image from multiple possible sources
function extractImage($, selectors) {
    for (const sel of selectors) {
        const node = $(sel).first();
        if (!node) continue;

        const src =
            node.attr("src") ||
            node.attr("data-old-hires") ||
            (node.attr("data-a-dynamic-image")
                ? Object.keys(JSON.parse(node.attr("data-a-dynamic-image")))[0]
                : null);

        if (src) return src;
    }
    return null;
}

// ⭐ Scrape one Amazon region
async function scrapeRegion(asin, region) {
    const url = REGION_URLS[region] + asin;

    const regionHeaders = {
        "User-Agent": [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        ][Math.floor(Math.random() * 4)],
        "Accept-Language": "en-US,en;q=0.9"
    };

    try {
        const response = await axios.get(url, {
            headers: regionHeaders,
            timeout: 12000
        });

        const $ = cheerio.load(response.data);

        const priceSelectors = [
            "#corePrice_feature_div .a-price .a-offscreen",
            "#corePrice_desktop .a-price .a-offscreen",
            "#priceblock_ourprice",
            "#priceblock_dealprice",
            "#priceblock_saleprice",
            "#price_inside_buybox",
            ".a-price .a-offscreen",
            ".a-color-price",
            "#apex_offerDisplay_desktop .a-price .a-offscreen",
            ".reinventPricePriceToPayMargin .a-offscreen",
            "#tmmSwatches .a-color-price"
        ];

        const titleSelectors = [
            "#productTitle",
            "#title",
            "h1",
            "#productTitle span",
            ".pdp-title"
        ];

        const imageSelectors = [
            "#landingImage",
            "#imgTagWrapperId img",
            "#ebooksImgBlkFront",
            ".a-dynamic-image"
        ];

        const availabilitySelectors = [
            "#availability .a-color-success",
            "#availability .a-color-state",
            "#availability",
            "#outOfStock",
            ".a-section #availability span",
            "#availability span.a-declarative"
        ];

        const shippingSelectors = [
            "#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE",
            "#delivery-message",
            ".delivery-message",
            "#ddmDeliveryMessage",
            "#delivery-block-message",
            ".a-section .deliveryMessage"
        ];

        const ratingSelectors = [
            "#acrPopover",
            ".a-icon-alt",
            "#averageCustomerReviews .a-icon-alt",
        ];

        const reviewCountSelectors = [
            "#acrCustomerReviewText",
            "#acrCustomerWriteReviewText",
            ".a-size-base .a-color-base",
        ];

        const badgeSelectors = [
            ".badge-link",
            "#zeitgeistBadge_feature_div .zg-badge-text",
            ".ac-badge-text-primary",
            ".ac-badging-text",
            ".badge-label"
        ];

        let priceRaw, titleRaw, availabilityRaw, shippingRaw, imageRaw;

        try {
            priceRaw = pickFirst($, priceSelectors);
            titleRaw = pickFirst($, titleSelectors);
            availabilityRaw = pickFirst($, availabilitySelectors);
            shippingRaw = pickFirst($, shippingSelectors);
            imageRaw = extractImage($, imageSelectors);
        } catch {
            // Retry with alternative selectors if available
            const altPriceSelectors = priceSelectors;
            const altTitleSelectors = titleSelectors;
            const altAvailabilitySelectors = availabilitySelectors;
            const altShippingSelectors = shippingSelectors;
            const altImageSelectors = imageSelectors;

            priceRaw = pickFirst($, altPriceSelectors);
            titleRaw = pickFirst($, altTitleSelectors);
            availabilityRaw = pickFirst($, altAvailabilitySelectors);
            shippingRaw = pickFirst($, altShippingSelectors);
            imageRaw = extractImage($, altImageSelectors);
        }

        // ⭐ Extract rating text like "4.6 out of 5 stars"
        let ratingRaw = pickFirst($, ratingSelectors);
        let rating = null;
        if (ratingRaw) {
            const match = ratingRaw.match(/([\d.,]+)/);
            if (match) rating = Number(match[1].replace(",", "."));
        }

        // ⭐ Extract review count
        let reviewsRaw = pickFirst($, reviewCountSelectors);
        let reviewCount = null;
        if (reviewsRaw) {
            const num = reviewsRaw.replace(/[^\d]/g, "");
            if (num) reviewCount = Number(num);
        }

        // ⭐ Extract product badge
        let badgeRaw = pickFirst($, badgeSelectors);
        let badge = badgeRaw ? badgeRaw.trim() : null;

        return {
            title: titleRaw ? titleRaw.trim() : null,
            image: imageRaw,
            price: normalizePrice(priceRaw),
            currency: CURRENCY_MAP[region],
            availability: availabilityRaw ? availabilityRaw.trim() : null,
            shipping: shippingRaw ? shippingRaw.trim() : null,
            rawPrice: priceRaw,
            rating,
            reviewCount,
            badge,
            scrapedAt: new Date().toISOString()
        };
    } catch (err) {
        console.log(`❌ Scrape failed for ${region.toUpperCase()}:`, err.message);
        return {
            title: null,
            image: null,
            price: null,
            currency: CURRENCY_MAP[region],
            availability: null,
            shipping: null,
            rawPrice: null,
            rating: null,
            reviewCount: null,
            badge: null,
            scrapedAt: new Date().toISOString()
        };
    }
}

// ⭐ Scrape ALL regions → return full dataset
export async function scrapeAmazonProduct(asin) {
    const result = {};

    for (const region of Object.keys(REGION_URLS)) {
        result[region] = await scrapeRegion(asin, region);
        result[region].region = region;
    }

    return result;
}

// Backward compat
export async function scrapeAllRegions(asin) {
    return scrapeAmazonProduct(asin);
}