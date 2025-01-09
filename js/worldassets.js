async function fetchMarketCaps() {
  const CACHE_KEY = "marketCapData";
  const THIRTEEN_MINUTES = 13 * 60 * 1000; // 13 minutes in ms

  try {
    // 1. Check if we already have cached data that is still valid
    const cachedDataString = localStorage.getItem(CACHE_KEY);
    const now = Date.now();

    if (cachedDataString) {
      const { timestamp, data } = JSON.parse(cachedDataString);

      // Check if cached data is still within 13 minutes
      if (now - timestamp < THIRTEEN_MINUTES) {
        // If within 13 minutes, use cached data
        console.log("Using cached market cap data.");
        return data; // { btcMarketCap, goldMarketCap }
      }
    }

    // 2. If no valid cache, fetch fresh data
    console.log("Fetching fresh market cap data from API...");

    const [bitcoinResponse, goldResponse] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/coins/bitcoin"),
      fetch("https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=usd&days=1"),
    ]);

    if (!bitcoinResponse.ok || !goldResponse.ok) {
      throw new Error(
        `API response error! Bitcoin: ${bitcoinResponse.status}, Gold: ${goldResponse.status}`
      );
    }

    const bitcoinData = await bitcoinResponse.json();
    const goldData = await goldResponse.json();

    const btcMarketCap = bitcoinData.market_data.market_cap.usd / 1e12; // Convert to trillions
    const goldPrice = goldData.prices[0][1];
    const totalGoldOunces = 197576 * 32150.7; // Gold supply in ounces
    const goldMarketCap = (goldPrice * totalGoldOunces) / 1e12; // Convert to trillions

    // 3. Save fetched data to localStorage with a timestamp
    const data = { btcMarketCap, goldMarketCap };
    const cacheObject = {
      timestamp: now,
      data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));

    return data;
  } catch (error) {
    console.error("Error fetching market cap data:", error.message, error.stack);
    throw new Error("Failed to fetch market cap data. Please try again later.");
  }
}

async function renderTreemap() {
  const { btcMarketCap, goldMarketCap } = await fetchMarketCaps();

  // Treemap data with size adjustments and font sizes
  const data = {
    name: "Assets",
    children: [
      { name: "Bitcoin", value: btcMarketCap * 1, displayValue: btcMarketCap, color: "#f79414", fontSize: "12px", isBitcoin: true },
      { name: "Gold", value: goldMarketCap * 1, displayValue: goldMarketCap, color: "#d8c059", fontSize: "14px" },
      { name: "Art", value: 18 * 1.25, displayValue: 18, color: "#b3eefc", fontSize: "14px" },
      { name: "Collectibles", value: 6 * 1, displayValue: 6, color: "#cc99ff", fontSize: "12px" },
      { name: "Equities", value: 115 * 1, displayValue: 115, color: "#79a6ff", fontSize: "16px" },
      { name: "Money", value: 120 * 1, displayValue: 120, color: "#b1e090", fontSize: "16px" },
      { name: "Bonds", value: 300 * 1, displayValue: 300, color: "#d9d9d9", fontSize: "16px" },
      { name: "Real Estate", value: 330 * 1, displayValue: 330, color: "#c9ab95", fontSize: "16px" },
    ],
  };

  // Clear any existing content to avoid overlay issues
  const container = d3.select("#treemapContainer");
  container.html(""); // Clear existing content

  const containerWidth = container.node().offsetWidth; // Get container width in pixels
  const containerHeight = container.node().offsetHeight; // Get container height in pixels
  const pixelMargin = 5; // Fixed 5px margin on all sides

  const treemap = d3.layout
    .treemap()
    .size([containerWidth, containerHeight]) // Use pixel-based size
    .sticky(true)
    .value((d) => d.value); // Use adjusted value for layout

  // Bind data to nodes
  const nodes = treemap.nodes(data);

  // Add divs for each node
  container
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("div")
    .attr("class", "node")
    .style("position", "absolute")
    .style("left", (d) => d.x + pixelMargin / 2 + "px") // Add half-margin to left
    .style("top", (d) => d.y + pixelMargin / 2 + "px") // Add half-margin to top
    .style("width", (d) => Math.max(0, d.dx - pixelMargin) + "px") // Subtract full margin from width
    .style("height", (d) => Math.max(0, d.dy - pixelMargin) + "px") // Subtract full margin from height
    .style("background", (d) => (d.children ? null : d.color))
    .style("display", "flex")
    .style("align-items", "center")
    .style("justify-content", (d) => (d.isBitcoin ? "flex-start" : "center")) // Left-align Bitcoin logo, center others
    .style("text-align", "center")
    .style("font-size", (d) => (d.children ? "0" : d.fontSize)) // Dynamically set font size
    .style("color", (d) => (d.isBitcoin ? "white" : "#000000")) // White font color for Bitcoin
    .style("border", "0px solid #202023")
    .style("border-radius", "3px") // Add border radius
    .html((d) =>
      d.children
        ? ""
        : d.isBitcoin
        ? `<div style="display: flex; align-items: center; gap: 0px; padding-left: 7px;">
             <img src="img/bitcoin-logo.png" alt="Bitcoin Logo" style="width:20px;height:20px;">
             <span>$${d.displayValue.toFixed(2)}T</span>
           </div>`
        : `<div>${d.name}<br>$${d.displayValue.toFixed(2)}T</div>`
    );
}

// Fetch and render treemap on page load
document.addEventListener("DOMContentLoaded", () => {
  renderTreemap();
});
