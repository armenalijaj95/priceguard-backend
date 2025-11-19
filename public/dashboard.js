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

            <a href="${p.url}" target="_blank">View Product</a>
        `;

        container.appendChild(card);
    });
}

document.getElementById("refreshBtn").addEventListener("click", loadProducts);

loadProducts();