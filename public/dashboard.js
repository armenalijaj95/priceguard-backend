const API_BASE = "https://priceguard-backend.onrender.com";

async function loadProducts() {
    const container = document.getElementById("productContainer");
    container.innerHTML = "Loading...";

    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();

    if (!data.success || !data.products) {
        container.innerHTML = "❌ Failed to load products";
        return;
    }

    container.innerHTML = "";

    data.products.forEach(p => {
        const initial = parseFloat(p.initialPrice || 0);
        const latest = parseFloat(p.latestPrice || 0);

        const priceDropPercent =
            initial > 0 ? (((initial - latest) / initial) * 100).toFixed(1) : null;

        const card = document.createElement("div");
        card.className = "card";

        let historyArray = (p.history || []).map(h => parseFloat(h.price));

        // Ensure sparkline works even with small data
        if (historyArray.length < 2) {
            historyArray = [initial, latest];
        }

        card.innerHTML = `
            <img src="${p.image}" />

            <h2>${p.title}</h2>

            <div class="price-row">
                <span class="price-old">${initial ? initial.toFixed(2) + "€" : "-"}</span>
                <span class="price-new">${latest ? latest.toFixed(2) + "€" : "-"}</span>
            </div>

            ${priceDropPercent > 0 ? 
                `<div class="badge-drop">⬇️ ${priceDropPercent}% price drop</div>` : ""
            }

            <div class="sparkline" id="spark-${p.asin}"></div>

            <div class="card-actions">
                <a href="${p.url}" target="_blank" class="view-btn">View Product</a>
                <button class="delete-btn" onclick="deleteProduct('${p.asin}')">🗑 Delete</button>
            </div>
        `;

        container.appendChild(card);

        // Draw sparkline
        generateSparkline(`spark-${p.asin}`, historyArray);
    });
}

// ---- Sparkline renderer ----
function generateSparkline(elementId, data) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    const w = canvas.width = container.offsetWidth;
    const h = canvas.height = 40;

    const max = Math.max(...data);
    const min = Math.min(...data);

    ctx.strokeStyle = "#0077ff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((val - min) / (max - min)) * h;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();
}


// ---- Delete Product ----
async function deleteProduct(asin) {
    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    const response = await fetch(`${API_BASE}/api/delete/${asin}`, {
        method: "DELETE"
    });

    const result = await response.json();

    if (result.success) {
        alert("Product deleted!");
        loadProducts(); 
    } else {
        alert("Error deleting product");
    }
}

document.getElementById("refreshBtn").addEventListener("click", loadProducts);

loadProducts();