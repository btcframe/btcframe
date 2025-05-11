async function fetchWithFallbackPage13(primaryUrl, fallbackUrl, parse = 'json') {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
    return parse === 'text' ? res.text() : res.json();
  } catch (err) {
    console.warn(`Primary failed: ${primaryUrl}`, err);
    try {
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) throw new Error(`Fallback failed: ${fallbackRes.status}`);
      return parse === 'text' ? fallbackRes.text() : fallbackRes.json();
    } catch (fallbackErr) {
      console.error(`Both primary and fallback APIs failed.`, fallbackErr);
      return null;
    }
  }
}

async function fetchMarketCaps() {
  const CACHE_KEY = "marketCapData";
  const THIRTEEN_MINUTES = 20 * 60 * 1000;

  try {
    const cachedDataString = localStorage.getItem(CACHE_KEY);
    const now = Date.now();

    if (cachedDataString) {
      const { timestamp, data } = JSON.parse(cachedDataString);
      if (now - timestamp < THIRTEEN_MINUTES) {
        return data;
      }
    }

    const [blockHeightText, priceData, goldResponse] = await Promise.all([
      fetchWithFallbackPage13(
        "https://mempool.btcframe.com/api/blocks/tip/height",
        "https://mempool.space/api/blocks/tip/height",
        "text"
      ),
      fetchWithFallbackPage13(
        "https://mempool.btcframe.com/api/v1/prices",
        "https://mempool.space/api/v1/prices"
      ),
      fetch("https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=usd&days=365"),
    ]);

    if (!blockHeightText || !priceData || !goldResponse.ok) {
      throw new Error(
        `API response error! Bitcoin Supply: ${blockHeightText ? "OK" : "FAIL"}, Bitcoin Price: ${priceData ? "OK" : "FAIL"}, Gold: ${goldResponse.status}`
      );
    }

    const blockHeight = parseInt(blockHeightText, 10);
    const supply = computeCirculatingSupply(blockHeight);
    const btcMarketCap = (priceData.USD * supply) / 1e12;

    const goldData = await goldResponse.json();
    const goldSupplyInTonnes = 215000;
    const ouncesPerTonne = 32150.7;
    const totalGoldSupplyInOunces = goldSupplyInTonnes * ouncesPerTonne;
    const goldMarketCaps = goldData.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString().split("T")[0],
      marketCap: (price * totalGoldSupplyInOunces) / 1e12
    }));

    const goldResult = aggregateMonthlyData(goldMarketCaps);
    const goldMarketCap = goldResult[goldResult.length - 1].marketCap;

    const data = { btcMarketCap, goldMarketCap };
    const cacheObject = { timestamp: now, data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));

    return data;
  } catch (error) {
    throw new Error("Failed to fetch market cap data. Please try again later.");
  }
}

function computeCirculatingSupply(blockHeight) {
  let supply = 0;
  let reward = 50;
  const halvingInterval = 210000;
  let remainingBlocks = blockHeight;

  while (remainingBlocks > 0) {
    const blocksThisInterval = Math.min(remainingBlocks, halvingInterval);
    supply += blocksThisInterval * reward;
    remainingBlocks -= blocksThisInterval;
    reward /= 2;
  }
  return supply;
}

function aggregateMonthlyData(data) {
  const monthlyData = {};
  data.forEach(({ date, marketCap }) => {
    const yearMonth = date.slice(0, 7);
    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = [];
    }
    monthlyData[yearMonth].push(marketCap);
  });
  return Object.entries(monthlyData).map(([month, values]) => ({
    date: month,
    marketCap: values.reduce((a, b) => a + b, 0) / values.length
  }));
}

async function renderTreemap() {
  const { btcMarketCap, goldMarketCap } = await fetchMarketCaps();

  const data = {
    name: "Assets",
    children: [
      { name: "Bitcoin", value: btcMarketCap * 1, displayValue: btcMarketCap, color: "#f79414", fontSize: "12px", isBitcoin: true },
      { name: "Gold", value: goldMarketCap * 1, displayValue: goldMarketCap, color: "#f0d049", fontSize: "14px" },
      { name: "Art", value: 18 * 1.25, displayValue: 18, color: "#b3eefc", fontSize: "14px" },
      { name: "Collectibles", value: 6 * 1, displayValue: 6, color: "#cc99ff", fontSize: "12px" },
      { name: "Equities", value: 115 * 1, displayValue: 115, color: "#79a6ff", fontSize: "16px" },
      { name: "Money", value: 120 * 1, displayValue: 120, color: "#b1e090", fontSize: "16px" },
      { name: "Bonds", value: 300 * 1, displayValue: 300, color: "#d9d9d9", fontSize: "16px" },
      { name: "Real Estate", value: 330 * 1, displayValue: 330, color: "#c9ab95", fontSize: "16px" },
    ],
  };

  const container = d3.select("#treemapContainer");
  container.html("");

  const containerWidth = container.node().offsetWidth;
  const containerHeight = container.node().offsetHeight;
  const pixelMargin = 5;

  const treemap = d3.layout
    .treemap()
    .size([containerWidth, containerHeight])
    .sticky(true)
    .value((d) => d.value);

  const nodes = treemap.nodes(data);

  container
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("div")
    .attr("class", "node")
    .style("position", "absolute")
    .style("left", (d) => d.x + pixelMargin / 2 + "px")
    .style("top", (d) => d.y + pixelMargin / 2 + "px")
    .style("width", (d) => Math.max(0, d.dx - pixelMargin) + "px")
    .style("height", (d) => Math.max(0, d.dy - pixelMargin) + "px")
    .style("background", (d) => (d.children ? null : d.color))
    .style("display", "flex")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("text-align", "center")
    .style("font-size", (d) => (d.children ? "0" : d.fontSize))
    .style("color", (d) => (d.isBitcoin ? "white" : "#000000"))
    .style("border", "0px solid #202023")
    .style("border-radius", "3px")
    .html((d) =>
      d.children
        ? ""
        : d.isBitcoin
        ? `<div class="bitcoin-content" style="display: flex; align-items: center; gap: 0px; padding-right: 3px;">
             <img src="img/bitcoin-logo.png" alt="Bitcoin Logo" style="width:20px; height:20px; margin-right: -3px;">
             <span>$${d.displayValue.toFixed(2)}T</span>
           </div>`
        : `<div>${d.name}<br>$${d.displayValue.toFixed(2)}T</div>`
    );
}

document.addEventListener("DOMContentLoaded", () => {
  renderTreemap();
});
