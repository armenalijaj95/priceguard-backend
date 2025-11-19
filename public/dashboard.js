const API_BASE = "https://priceguard-backend.onrender.com";

// 🌍 Regions we support
const REGIONS = ["de", "it", "fr", "es", "uk", "us"];

// 🌍 Country flags
const REGION_FLAGS = {
    de: "🇩🇪",
    it: "🇮🇹",
    fr: "🇫🇷",
    es: "🇪🇸",
    uk: "🇬🇧",
    us: "🇺🇸"
};

// 💶 Currency symbols
const REGION_CURRENCY = {
    de: "€",
    it: "€",
    fr: "€",
    es: "€",
    uk: "£",
    us: "$"
};


// 🔥 Render sparkline (already existing function)
function generateSparkline(elementId, data) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const canvas = document.createElement("canvas");
    container.innerHTML = "";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    const w = canvas.width = container.offsetWidth;
    const h = canvas.height = 60;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.lineWidth = 3;

    // Glow
    ctx.shadowColor = "rgba(0, 150, 255, 0.9)";
    ctx.shadowBlur = 12;

    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#00c8ff");
    gradient.addColorStop(1, "#8a2be2");

    ctx.strokeStyle = gradient;
    ctx.beginPath();

    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * w,
        y: h - ((val - min) / range) * h
    }));

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        const cpX = (points[i - 1].x + points[i].x) / 2;
        const cpY = (points[i - 1].y + points[i].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, cpX, cpY);
    }

    ctx.stroke();

    // Highlight min & max points
    const extremes = [
        { x: points[data.indexOf(min)].x, y: points[data.indexOf(min)].y, color: "#00ff99" },
        { x: points[data.indexOf(max)].x, y: points[data.indexOf(max)].y, color: "#ff0077" }
    ];

    extremes.forEach(p => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}


// 📌 Format prices with currency
function formatPrice(price, region) {
    if (!price && price !== 0) return "-";
    const symbol = REGION_CURRENCY[region];
    return `${price.toFixed(2)}${symbol}`;
}


// 🔥 Build product cards with multi-region data
async function loadProducts() {
    const container = document.getElementById("productContainer");
    container.innerHTML = "Loading…";

    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();

    if (!data.success) {
        container.innerHTML = "❌ Failed to load products";
        return;
    }

    container.innerHTML = "";

    data.products.forEach(product => {
        const card = document.createElement("div");
        card.className = "card";

        // Build HTML
        card.innerHTML = `
            <img src="${product.image || ""}" />

            <h2>${product.title}</h2>

            <div style="font-size:13px; color:#555; margin-bottom:8px;">
                Last updated: ${new Date(product.updatedAt || product.createdAt).toLocaleString()}
            </div>

            <div class="region-grid">
                ${REGIONS.map(region => {
                    const p = product.prices[region];
                    const latest = p?.price || null;

                    const history = p?.history?.map(h => h.price) || [];
                    const hasHistory = history.length > 1;

                    let trendHtml = "";
                    if (hasHistory) {
                        const first = history[0];
                        const last = history[history.length - 1];
                        const change = (((last - first) / first) * 100).toFixed(1);

                        if (change > 0) trendHtml = `<span class="trend-up">+${change}% ↑</span>`;
                        else if (change < 0) trendHtml = `<span class="trend-down">${change}% ↓</span>`;
                        else trendHtml = `<span class="trend-neutral">0%</span>`;
                    }

                    return `
                        <div class="region-box">
                            <div class="region-flag">${REGION_FLAGS[region]}</div>
                            <div class="region-price">${latest ? formatPrice(latest, region) : "-"}</div>
                            <div class="region-trend">${trendHtml}</div>
                            <div class="sparkline" id="spark-${product.asin}-${region}"></div>
                        </div>
                    `;
                }).join("")}
            </div>

            <div class="card-actions">
                <a href="${product.url}" target="_blank" class="view-btn">View Product</a>
                <button class="delete-btn" onclick="deleteProduct('${product.asin}')">🗑 Delete</button>
            </div>
        `;

        container.appendChild(card);

        // Draw sparkline for each region
        REGIONS.forEach(region => {
            const history = product.prices[region]?.history?.map(h => h.price);
            if (history && history.length > 1) {
                generateSparkline(`spark-${product.asin}-${region}`, history);
            }
        });
    });
}


// ❌ Delete product
async function deleteProduct(asin) {
    if (!confirm("Delete this product?")) return;

    const res = await fetch(`${API_BASE}/api/delete/${asin}`, { method: "DELETE" });
    const data = await res.json();

    if (!data.success) {
        alert("❌ Failed to delete");
        return;
    }

    loadProducts();
}


// 🔄 Refresh button
document.getElementById("refreshBtn").addEventListener("click", loadProducts);

// Load on start
loadProducts();