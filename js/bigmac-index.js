const BIGMAC_USD_DATA = {
  2000: 2.24, 2001: 2.24, 2002: 2.35, 2003: 2.46, 2004: 2.47,
  2005: 2.58, 2006: 2.78, 2007: 3.00, 2008: 3.21, 2009: 3.43,
  2010: 3.53, 2011: 3.64, 2012: 3.96, 2013: 4.18, 2014: 4.29,
  2015: 4.29, 2016: 4.50, 2017: 4.50, 2018: 4.62, 2019: 4.71,
  2020: 4.82, 2021: 4.93, 2022: 5.15, 2023: 5.58, 2024: 5.69, 2025: 5.79
};

const BIGMAC_CACHE_KEY = "bigMacBTCData";
const BIGMAC_CACHE_DURATION = 5 * 60 * 1000;

function getExactTimestamp(yearsAgo) {
  const today = new Date();
  today.setFullYear(today.getFullYear() - yearsAgo);
  return Math.floor(today.getTime() / 1000);
}

async function fetchMempoolBTCPrice(timestamp) {
  const url = `https://mempool.btcframe.com/api/v1/historical-price?currency=USD&timestamp=${timestamp}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.prices?.[0]?.USD !== undefined) {
    return data.prices[0].USD;
  }
  throw new Error(`BTC price missing for timestamp: ${timestamp}`);
}

async function fetchAndDisplayBigMacPrices() {
  try {
    const cached = getBigMacCache();
    if (cached) {
      displayBigMacData(cached.values, cached.changes);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const d = 86400;
    const year = new Date().getFullYear();

    const [
      btcNow, btc24h, btc7d, btc30d,
      btc1y, btc3y, btc5y, btc10y
    ] = await Promise.all([
      fetchMempoolBTCPrice(now),
      fetchMempoolBTCPrice(now - d),
      fetchMempoolBTCPrice(now - 7 * d),
      fetchMempoolBTCPrice(now - 30 * d),
      fetchMempoolBTCPrice(getExactTimestamp(1)),
      fetchMempoolBTCPrice(getExactTimestamp(3)),
      fetchMempoolBTCPrice(getExactTimestamp(5)),
      fetchMempoolBTCPrice(getExactTimestamp(10))
    ]);

    const usd = BIGMAC_USD_DATA;

    const values = {
      current: usd[year] / btcNow,
      '7d': usd[year] / btc7d,
      '30d': usd[year] / btc30d,
      '1y': usd[year - 1] / btc1y,
      '3y': usd[year - 3] / btc3y,
      '5y': usd[year - 5] / btc5y,
      '10y': usd[year - 10] / btc10y
    };

    const changes = {
      current: ((btcNow - btc24h) / btc24h) * 100,
      '7d': ((btcNow - btc7d) / btc7d) * 100,
      '30d': ((btcNow - btc30d) / btc30d) * 100,
      '1y': ((btcNow - btc1y) / btc1y) * 100,
      '3y': ((values['3y'] - values.current) / values.current) * 100,
      '5y': ((values['5y'] - values.current) / values.current) * 100,
      '10y': ((values['10y'] - values.current) / values.current) * 100
    };

    localStorage.setItem(BIGMAC_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: { values, changes }
    }));

    displayBigMacData(values, changes);
  } catch (err) {
    console.error("BigMac Index Error:", err);
    document.getElementById("current-bigmac-btc").textContent = "Error loading";
  }
}

function displayBigMacData(values, changes) {
  document.getElementById("current-bigmac-btc").textContent = `${formatSats(values.current)} sats`;

  document.getElementById("bigmac-7d-value").textContent = `${formatSats(values["7d"])} sats`;
  document.getElementById("bigmac-30d-value").textContent = `${formatSats(values["30d"])} sats`;
  document.getElementById("bigmac-1y-value").textContent = `${formatSats(values["1y"])} sats`;
  document.getElementById("bigmac-3y-value").textContent = `${formatSats(values["3y"])} sats`;
  document.getElementById("bigmac-5y-value").textContent = `${formatSats(values["5y"])} sats`;
  document.getElementById("bigmac-10y-value").textContent = `${formatSats(values["10y"])} sats`;

  updateChange("bigmac-price-change", changes.current);
  updateChange("bigmac-7d-change", changes["7d"]);
  updateChange("bigmac-30d-change", changes["30d"]);
  updateChange("bigmac-1y-change", changes["1y"]);
  updateChange("bigmac-3y-change", changes["3y"]);
  updateChange("bigmac-5y-change", changes["5y"]);
  updateChange("bigmac-10y-change", changes["10y"]);

  const dot = document.getElementById("bigmac-dot");
  if (dot) {
    const dotColor = changes.current > 0 ? "green" : changes.current < 0 ? "red" : "gray";
    dot.style.setProperty("background-color", dotColor, "important");
  }
}

function updateChange(id, change) {
  const el = document.getElementById(id);
  if (!el) return;
  const symbol = change > 0 ? "▲" : change < 0 ? "▼" : "■";
  const color = change > 0 ? "green" : change < 0 ? "red" : "gray";
  el.textContent = `${Number(change.toFixed(2)).toLocaleString("en-US")}% ${symbol}`;
  el.style.color = color;
}

function formatSats(btc) {
  return Math.round(btc * 100000000).toLocaleString("en-US");
}

function getBigMacCache() {
  const cached = localStorage.getItem(BIGMAC_CACHE_KEY);
  if (!cached) return null;
  const { timestamp, data } = JSON.parse(cached);
  if (Date.now() - timestamp > BIGMAC_CACHE_DURATION) {
    localStorage.removeItem(BIGMAC_CACHE_KEY);
    return null;
  }
  return data;
}

setInterval(fetchAndDisplayBigMacPrices, BIGMAC_CACHE_DURATION);
document.addEventListener("DOMContentLoaded", fetchAndDisplayBigMacPrices);
