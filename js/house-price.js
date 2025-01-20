const HOUSE_PRICE_API = "https://house-price.ngrok.app/api/house-price";
const BTC_PRICE_API = "https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD"; // Current price
const BTC_HISTOHOUR_API = "https://min-api.cryptocompare.com/data/v2/histohour"; // For 24-hour ago price
const BTC_HISTORY_API = "https://min-api.cryptocompare.com/data/v2/histoday"; // For historical prices
const HOUSE_PRICE_CACHE_KEY = "housePriceBTCData";
const CACHE_DURATION = 16 * 60 * 1000; // 15 minutes in milliseconds

// Fetch historical BTC price based on days ago
async function fetchHistoricalBTCPrice(daysAgo) {
    const response = await fetch(`${BTC_HISTORY_API}?fsym=BTC&tsym=USD&limit=${daysAgo + 1}`);
    const data = await response.json();
    if (data.Response === "Success" && data.Data && data.Data.Data.length > 0) {
        const historicalData = data.Data.Data;
        const targetDayData = historicalData[historicalData.length - 1 - daysAgo];
        return targetDayData.close;
    } else {
        throw new Error(`Failed to fetch BTC price for ${daysAgo} days ago`);
    }
}

// Fetch BTC price exactly 24 hours ago
async function fetch24HourAgoBTCPrice() {
    const response = await fetch(`${BTC_HISTOHOUR_API}?fsym=BTC&tsym=USD&limit=24`);
    const data = await response.json();
    if (data.Response === "Success" && data.Data && data.Data.Data.length > 0) {
        const historicalData = data.Data.Data;
        const price24hAgo = historicalData[0].close; // 24 hours ago
        return price24hAgo;
    } else {
        throw new Error("Failed to fetch BTC 24-hour ago price");
    }
}

// Fetch and display house prices with BTC conversions
async function fetchAndDisplayHousePrices() {
    try {
        const cachedData = getHousePriceCache();
        if (cachedData) {
            displayData(cachedData.values, cachedData.changes);
            return;
        }

        // Fetch current BTC price
        const currentPriceResponse = await fetch(BTC_PRICE_API);
        const currentPriceData = await currentPriceResponse.json();
        const btcPriceUSD = currentPriceData.USD;

        // Fetch 24-hour and historical prices
        const [btcPrice24h, btcPrice7d, btcPrice30d, btcPrice1y] = await Promise.all([
            fetch24HourAgoBTCPrice(),
            fetchHistoricalBTCPrice(7),
            fetchHistoricalBTCPrice(30),
            fetchHistoricalBTCPrice(365)
        ]);

        const housePriceResponse = await fetch(HOUSE_PRICE_API);
        const housePriceData = await housePriceResponse.json();
        const latestObs = housePriceData.observations[housePriceData.observations.length - 1];
        const yearAgoObs = housePriceData.observations[housePriceData.observations.length - 12];

        const latestPriceUSD = parseFloat(latestObs.value);
        const yearAgoPriceUSD = parseFloat(yearAgoObs.value);

        // Calculate BTC values
        const values = {
            current: (latestPriceUSD / btcPriceUSD).toFixed(2),
            '7d': (latestPriceUSD / btcPrice7d).toFixed(2),
            '30d': (latestPriceUSD / btcPrice30d).toFixed(2),
            '1y': (yearAgoPriceUSD / btcPrice1y).toFixed(2)
        };

        // Calculate changes
        const changes = {
            current: ((btcPriceUSD - btcPrice24h) / btcPrice24h) * 100,
            '7d': ((btcPriceUSD - btcPrice7d) / btcPrice7d) * 100,
            '30d': ((btcPriceUSD - btcPrice30d) / btcPrice30d) * 100,
            '1y': ((btcPriceUSD - btcPrice1y) / btcPrice1y) * 100
        };

        // Cache and display the data
        localStorage.setItem(HOUSE_PRICE_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: { values, changes } }));
        displayData(values, changes);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById("current-house-btc").textContent = "Error loading data";
    }
}

// Display BTC values and changes
function displayData(values, changes) {
    document.getElementById('current-house-btc').textContent = `₿${values.current}`;
    document.querySelector('[data-type="7d"]').textContent = `₿${values['7d']}`;
    document.querySelector('[data-type="30d"]').textContent = `₿${values['30d']}`;
    document.querySelector('[data-type="1y"]').textContent = `₿${values['1y']}`;

    updateChange('house-price-change', changes.current);
    updateChange('seven-days-change', changes['7d']);
    updateChange('thirty-days-change', changes['30d']);
    updateChange('one-year-change', changes['1y']);

    // Update the flashing dot based on the current price change
    const dot = document.getElementById('house-price-dot');
    if (dot) {
        dot.classList.add('flashing-dot', 'active');
        dot.style.backgroundColor = changes.current > 0 ? 'green' : changes.current < 0 ? 'red' : 'gray';
    }
}

// Update percentage changes
function updateChange(elementId, change) {
    const element = document.getElementById(elementId);
    if (element) {
        const symbol = change > 0 ? '▲' : change < 0 ? '▼' : '■';
        const color = change > 0 ? 'green' : change < 0 ? 'red' : 'gray';
        element.textContent = `${Math.abs(change).toFixed(2)}% ${symbol}`;
        element.style.color = color;
    }
}

// Cache utilities
function getHousePriceCache() {
    const cached = localStorage.getItem(HOUSE_PRICE_CACHE_KEY);
    if (!cached) return null;
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(HOUSE_PRICE_CACHE_KEY);
        return null;
    }
    return data;
}

// Add required styles
const housePriceStyle = document.createElement('style');
housePriceStyle.textContent = `
    .flashing-dot {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        margin-right: 20px;
    }
    .flashing-dot.active {
        animation: flash 1s infinite;
    }
    @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(housePriceStyle);

// Auto-update setup
setInterval(fetchAndDisplayHousePrices, CACHE_DURATION);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndDisplayHousePrices);
} else {
    fetchAndDisplayHousePrices();
}
