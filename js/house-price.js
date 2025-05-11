// -----------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------
const HOUSE_PRICE_API = "https://house-price.btcframe.com/";
const HOUSE_PRICE_CACHE_KEY = "housePriceBTCData";
const HOUSE_PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// -----------------------------------------------------------------
// FUNCTION TO GET EXACT TIMESTAMP FOR PAST DATES
// -----------------------------------------------------------------
function getExactTimestamp(yearsAgo) {
  const today = new Date();
  today.setFullYear(today.getFullYear() - yearsAgo);
  return Math.floor(today.getTime() / 1000);
}

// -----------------------------------------------------------------
// mempool.btcframe.com HISTORICAL PRICE FUNCTION
// -----------------------------------------------------------------
async function fetchMempoolBTCPrice(timestamp) {
  const url = `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${timestamp}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.prices && data.prices.length > 0 && data.prices[0].USD !== undefined) {
    return data.prices[0].USD;
  } else {
    throw new Error(`Failed to fetch BTC price for timestamp: ${timestamp}`);
  }
}

// -----------------------------------------------------------------
// MAIN FUNCTION TO FETCH & DISPLAY HOUSE PRICES
// -----------------------------------------------------------------
async function fetchAndDisplayHousePrices() {
  try {
    const cachedData = getHousePriceCache();
    if (cachedData) {
      displayData(cachedData.values, cachedData.changes);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const secondsPerDay = 24 * 60 * 60;

    const [
      btcPriceCurrent,
      btcPrice24h,
      btcPrice7d,
      btcPrice30d,
      btcPrice1y,
      btcPrice3y,
      btcPrice5y,
      btcPrice10y
    ] = await Promise.all([
      fetchMempoolBTCPrice(now),
      fetchMempoolBTCPrice(now - 1 * secondsPerDay),
      fetchMempoolBTCPrice(now - 7 * secondsPerDay),
      fetchMempoolBTCPrice(now - 30 * secondsPerDay),
      fetchMempoolBTCPrice(getExactTimestamp(1)),  
      fetchMempoolBTCPrice(getExactTimestamp(3)),  
      fetchMempoolBTCPrice(getExactTimestamp(5)),  
      fetchMempoolBTCPrice(getExactTimestamp(10))  
    ]);

    const housePriceResponse = await fetch(HOUSE_PRICE_API);
    const housePriceData = await housePriceResponse.json();
    const observations = housePriceData.observations;

    const latestObs = observations[observations.length - 1];
    const yearAgoObs = observations[observations.length - 12];
    const threeYearObs = observations[observations.length - 36];
    const fiveYearObs = observations[observations.length - 60];
    const tenYearObs = observations[observations.length - 120];

    const latestPriceUSD = parseFloat(latestObs.value);
    const yearAgoPriceUSD = parseFloat(yearAgoObs.value);
    const threeYearPriceUSD = parseFloat(threeYearObs.value);
    const fiveYearPriceUSD = parseFloat(fiveYearObs.value);
    const tenYearPriceUSD = parseFloat(tenYearObs.value);

    // Calculate historical BTC prices using the BTC price from each respective period
    const housePriceBTC_Current = latestPriceUSD / btcPriceCurrent;
    const housePriceBTC_3y = threeYearPriceUSD / btcPrice3y;
    const housePriceBTC_5y = fiveYearPriceUSD / btcPrice5y;
    const housePriceBTC_10y = tenYearPriceUSD / btcPrice10y;

    const values = {
      current: formatPriceNumber(housePriceBTC_Current),
      '7d': formatPriceNumber(latestPriceUSD / btcPrice7d),
      '30d': formatPriceNumber(latestPriceUSD / btcPrice30d),
      '1y': formatPriceNumber(yearAgoPriceUSD / btcPrice1y),
      '3y': formatPriceNumber(housePriceBTC_3y),
      '5y': formatPriceNumber(housePriceBTC_5y),
      '10y': formatPriceNumber(housePriceBTC_10y)
    };

    const changes = {
      current: ((btcPriceCurrent - btcPrice24h) / btcPrice24h) * 100,
      '7d': ((btcPriceCurrent - btcPrice7d) / btcPrice7d) * 100,
      '30d': ((btcPriceCurrent - btcPrice30d) / btcPrice30d) * 100,
      '1y': ((btcPriceCurrent - btcPrice1y) / btcPrice1y) * 100,
      '3y': ((housePriceBTC_3y - housePriceBTC_Current) / housePriceBTC_Current) * 100,
      '5y': ((housePriceBTC_5y - housePriceBTC_Current) / housePriceBTC_Current) * 100,
      '10y': ((housePriceBTC_10y - housePriceBTC_Current) / housePriceBTC_Current) * 100
    };

    localStorage.setItem(
      HOUSE_PRICE_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), data: { values, changes } })
    );

    displayData(values, changes);
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("current-house-btc").textContent = "Error loading data";
  }
}

// -----------------------------------------------------------------
// DISPLAY & HELPER FUNCTIONS
// -----------------------------------------------------------------
function displayData(values, changes) {
  // Update the current house price display
  document.getElementById("current-house-btc").textContent = `₿${values.current}`;
  document.querySelector('[data-type="7d"]').textContent = `₿${values["7d"]}`;
  document.querySelector('[data-type="30d"]').textContent = `₿${values["30d"]}`;
  document.querySelector('[data-type="1y"]').textContent = `₿${values["1y"]}`;
  document.querySelector('[data-type="3y"]').textContent = `₿${values["3y"]}`;
  document.querySelector('[data-type="5y"]').textContent = `₿${values["5y"]}`;
  document.querySelector('[data-type="10y"]').textContent = `₿${values["10y"]}`;

  // Update the percentage change displays for all intervals
  updateChange("house-price-change", changes.current);
  updateChange("seven-days-change", changes["7d"]);
  updateChange("thirty-days-change", changes["30d"]);
  updateChange("one-year-change", changes["1y"]);
  updateChange("three-years-change", changes["3y"]);
  updateChange("five-years-change", changes["5y"]);
  updateChange("ten-years-change", changes["10y"]);

  // Update the Flashing Dot for House Price
  const dotEl = document.getElementById("house-price-dot");
  if (dotEl) {
    const dotColor = changes.current > 0 ? "green" : changes.current < 0 ? "red" : "gray";
    dotEl.style.setProperty("background-color", dotColor, "important");
  }
}

function updateChange(elementId, change) {
  const element = document.getElementById(elementId);
  if (element) {
    const symbol = change > 0 ? "▲" : change < 0 ? "▼" : "■";
    const color = change > 0 ? "green" : change < 0 ? "red" : "gray";
    element.textContent = `${formatPriceNumber(Math.abs(change))}% ${symbol}`;
    element.style.color = color;
  }
}

function formatPriceNumber(num) {
  return parseFloat(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getHousePriceCache() {
  const cached = localStorage.getItem(HOUSE_PRICE_CACHE_KEY);
  if (!cached) return null;
  const { timestamp, data } = JSON.parse(cached);
  if (Date.now() - timestamp > HOUSE_PRICE_CACHE_DURATION) {
    localStorage.removeItem(HOUSE_PRICE_CACHE_KEY);
    return null;
  }
  return data;
}

// -----------------------------------------------------------------
// AUTO-UPDATE SETUP
// -----------------------------------------------------------------
setInterval(fetchAndDisplayHousePrices, HOUSE_PRICE_CACHE_DURATION);
document.addEventListener("DOMContentLoaded", fetchAndDisplayHousePrices);
