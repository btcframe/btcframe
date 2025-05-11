const MCAP_CACHE_DURATION = 20 * 60 * 1000; // 20 minutes in milliseconds

let bitcoinCache = {
  data: null,
  timestamp: null
};

let goldCache = {
  data: null,
  timestamp: null
};

// === Scoped fallback fetch just for Page 12 ===
async function fetchWithFallbackPage12(primaryUrl, fallbackUrl, parse = 'json') {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
    return parse === 'text' ? res.text() : res.json();
  } catch (err) {
    console.warn(`Primary API failed: ${primaryUrl}`, err);
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

async function fetchHistoricalBitcoinMarketCap() {
  const now = Date.now();
  if (bitcoinCache.data && (now - bitcoinCache.timestamp) < MCAP_CACHE_DURATION) {
    return bitcoinCache.data;
  }

  try {
    // Get current block height and calculate supply
    const blockHeightText = await fetchWithFallbackPage12(
      "https://mempool.btcframe.com/api/blocks/tip/height",
      "https://mempool.space/api/blocks/tip/height",
      "text"
    );
    const blockHeight = parseInt(blockHeightText, 10);
    const supply = computeCirculatingSupply(blockHeight);

    // Get current price
    const priceData = await fetchWithFallbackPage12(
      "https://mempool.space/api/v1/prices",
      "https://mempool.space/api/v1/prices"
    );
    const currentPrice = priceData.USD;
    const currentMarketCap = (currentPrice * supply) / 1e12;
    const currentDate = new Date().toISOString().split('T')[0];

    // Generate timestamps for the past year
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (365 * 24 * 60 * 60);
    const timestamps = [];
    for (let timestamp = startDate; timestamp <= endDate; timestamp += 24 * 60 * 60) {
      timestamps.push(timestamp);
    }

    // Fetch historical prices
    const pricePromises = timestamps.map(timestamp =>
      fetchWithFallbackPage12(
        `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${timestamp}`,
        `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${timestamp}`
      ).then(res => res)
    );

    const priceResponses = await Promise.all(pricePromises);

    const bitcoinMarketCaps = priceResponses
      .filter(response => response && response.prices && response.prices[0])
      .map(response => ({
        date: new Date(response.prices[0].time * 1000).toISOString().split("T")[0],
        marketCap: (response.prices[0].USD * supply) / 1e12
      }));

    const result = aggregateMonthlyData(bitcoinMarketCaps);
    const currentMonth = currentDate.slice(0, 7);
    const lastIndex = result.findIndex(item => item.date === currentMonth);
    if (lastIndex !== -1) {
      result[lastIndex].marketCap = currentMarketCap;
    }

    bitcoinCache = {
      data: result,
      timestamp: now
    };

    return result;
  } catch (error) {
    console.error(error);
    return bitcoinCache.data || [];
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

async function fetchHistoricalGoldMarketCap() {
  const now = Date.now();
  if (goldCache.data && (now - goldCache.timestamp) < MCAP_CACHE_DURATION) {
    return goldCache.data;
  }

  try {
    const goldResponse = await fetch(
      "https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=usd&days=365"
    );
    const goldData = await goldResponse.json();
    const goldSupplyInTonnes = 215000;
    const ouncesPerTonne = 32150.7;
    const totalGoldSupplyInOunces = goldSupplyInTonnes * ouncesPerTonne;
    const goldMarketCaps = goldData.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString().split("T")[0],
      marketCap: (price * totalGoldSupplyInOunces) / 1e12
    }));

    const result = aggregateMonthlyData(goldMarketCaps);
    goldCache = {
      data: result,
      timestamp: now
    };

    return result;
  } catch (error) {
    console.error(error);
    return goldCache.data || [];
  }
}

async function renderMarketCapChart() {
  const ctx = document.getElementById("marketCapChart").getContext("2d");
  const [bitcoinMarketCaps, goldMarketCaps] = await Promise.all([
    fetchHistoricalBitcoinMarketCap(),
    fetchHistoricalGoldMarketCap()
  ]);

  const allDates = [
    ...new Set([
      ...bitcoinMarketCaps.map(d => d.date),
      ...goldMarketCaps.map(d => d.date)
    ])
  ].sort();

  const btcValues = allDates.map(date => bitcoinMarketCaps.find(d => d.date === date)?.marketCap || 0);
  const goldValues = allDates.map(date => goldMarketCaps.find(d => d.date === date)?.marketCap || 0);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: allDates,
      datasets: [
        {
          label: "Bitcoin",
          data: btcValues,
          fill: true,
          backgroundColor: "rgba(255, 165, 0, 0.2)",
          borderColor: "rgba(255, 165, 0, 0.8)",
          lineTension: 0.4
        },
        {
          label: "Gold",
          data: goldValues,
          fill: true,
          backgroundColor: "rgba(224, 212, 182, 0.2)",
          borderColor: "rgba(194, 169, 108, 0.8)",
          lineTension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: false
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            const rawValue = tooltipItem.yLabel;
            return data.datasets[tooltipItem.datasetIndex].label + ": " + parseFloat(rawValue).toFixed(2) + "T";
          }
        }
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true
          },
          ticks: {
            fontColor: "rgba(255, 255, 255, 0.7)",
            padding: 10
          },
          gridLines: {
            color: "rgba(255, 255, 255, 0.03)",
            drawBorder: true,
            drawTicks: false,
            zeroLineColor: "rgba(255, 255, 255, 0.03)"
          }
        }],
        yAxes: [{
          type: "linear",
          scaleLabel: {
            display: true,
            labelString: "Market Capitalization (in Trillions)",
            fontColor: "rgba(255, 255, 255, 0.7)"
          },
          ticks: {
            fontColor: "rgba(255, 255, 255, 0.7)",
            padding: 10,
            callback: function (value) {
              const num = Number(value);
              return num === 0 ? "0T" : num.toLocaleString() + "T";
            }
          },
          gridLines: {
            color: "rgba(255, 255, 255, 0.03)",
            drawBorder: true,
            drawTicks: false,
            zeroLineColor: "rgba(255, 255, 255, 0.03)"
          }
        }]
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", renderMarketCapChart);
