async function fetchMarketCaps() {
  try {
    const [bitcoinData, goldData] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"),
      fetch("https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=usd&days=1"),
    ]);

    const btcMarketCap = await bitcoinData.json().then((data) => data.market_caps[0][1] / 1e12); // Trillions
    const goldPrice = await goldData.json().then((data) => data.prices[0][1]);
    const totalGoldOunces = 197576 * 32150.7; // Gold supply in ounces
    const goldMarketCap = (goldPrice * totalGoldOunces) / 1e12; // Trillions

    return { btcMarketCap, goldMarketCap };
  } catch (error) {
    console.error("Error fetching market cap data:", error);
    return { btcMarketCap: 1.9, goldMarketCap: 17 }; // Fallback values
  }
}

async function renderTreemap() {
  const { btcMarketCap, goldMarketCap } = await fetchMarketCaps();

  // Treemap data with size adjustments and font sizes
  const data = {
    name: "Assets",
    children: [
      { name: "Bitcoin", value: btcMarketCap * 1, displayValue: btcMarketCap, color: "#f79414", fontSize: "12px", isBitcoin: true },
      { name: "Gold", value: goldMarketCap * 1, displayValue: goldMarketCap, color: "#f7e787", fontSize: "14px" },
      { name: "Art", value: 18 * 1.25, displayValue: 18, color: "#9bc2e6", fontSize: "14px" },
      { name: "Collectibles", value: 6 * 1, displayValue: 6, color: "#cc99ff", fontSize: "12px" },
      { name: "Equities", value: 115 * 1, displayValue: 115, color: "#79a6ff", fontSize: "16px" },
      { name: "Money", value: 120 * 1, displayValue: 120, color: "#c6e0b4", fontSize: "16px" },
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
    ); // Add line break or image for Bitcoin
}
