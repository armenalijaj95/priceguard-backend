import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeAmazonProduct(url) {
    try {
        const res = await axios.get("http://api.scraperapi.com", {
            params: {
                api_key: process.env.SCRAPERAPI_KEY,
                url: url,
                country_code: "de"
            }
        });

        const html = res.data;
        const $ = cheerio.load(html);

        const title = $("#productTitle").text().trim();
        const priceText = $("#corePrice_feature_div .a-offscreen").first().text().trim();
        const priceDisplay = priceText; // keep exact Amazon formatting
        const image = $("#landingImage").attr("src");

        const price = priceText
            ? parseFloat(priceText.replace(/[^\d,]/g, "").replace(/\./g, "").replace(",", "."))
            : null;

        return { 
            title, 
            price, 
            priceDisplay, 
            image 
        };
    } catch (err) {
        console.error("Scraper Error:", err);
        return null;
    }
}