const HOUSE_PRICE_API = "https://house-price.ngrok.app/api/house-price";
const BTC_PRICE_API = "https://min-api.cryptocompare.com/data/v2/histoday";
const HOUSE_PRICE_CACHE_KEY = "housePriceBTCData";
const CACHE_DURATION = 16 * 60 * 1000; // 16 minutes in milliseconds

async function fetchHistoricalBTCPrice(daysAgo) {
    const limit = daysAgo; // Fetch historical data based on daysAgo
    const response = await fetch(`${BTC_PRICE_API}?fsym=BTC&tsym=USD&limit=${limit}`);
    const data = await response.json();
    if (data.Response === "Success" && data.Data && data.Data.Data.length > 0) {
        // Get the closing price of the specified day
        const historicalData = data.Data.Data;
        const targetDayData = historicalData[historicalData.length - daysAgo - 1];
        return targetDayData.close;
    } else {
        throw new Error("Failed to fetch BTC historical price data");
    }
}

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

async function fetchAndDisplayHousePrices() {
    try {
        // Check cache first
        const cachedData = getHousePriceCache();
        if (cachedData) {
            document.getElementById('current-house-btc').textContent = `₿${cachedData.values.current}`;
            document.querySelector('[data-type="7d"]').textContent = `₿${cachedData.values['7d']}`;
            document.querySelector('[data-type="30d"]').textContent = `₿${cachedData.values['30d']}`;
            document.querySelector('[data-type="1y"]').textContent = `₿${cachedData.values['1y']}`;

            updateChange('house-price-change', cachedData.changes.current);
            updateChange('seven-days-change', cachedData.changes['7d']);
            updateChange('thirty-days-change', cachedData.changes['30d']);
            updateChange('one-year-change', cachedData.changes['1y']);

            const dot = document.getElementById('house-price-dot');
            if (dot) {
                dot.style.backgroundColor = cachedData.changes.current > 0 ? 'green' : cachedData.changes.current < 0 ? 'red' : 'gray';
                dot.classList.add('active');
            }
            return;
        }

        // If no cache, fetch fresh data
        const btcPriceResponse = await fetch(`${BTC_PRICE_API}?fsym=BTC&tsym=USD&limit=1`);
        const btcPriceData = await btcPriceResponse.json();
        const btcPriceUSD = btcPriceData.Data.Data[btcPriceData.Data.Data.length - 1].close;

        // Fetch historical prices
        const [btcPrice24h, btcPrice7d, btcPrice30d, btcPrice1y] = await Promise.all([
            fetchHistoricalBTCPrice(1),
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

        // Cache the data
        localStorage.setItem(HOUSE_PRICE_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: { values, changes }
        }));

        // Update BTC values
        document.getElementById('current-house-btc').textContent = `₿${values.current}`;
        document.querySelector('[data-type="7d"]').textContent = `₿${values['7d']}`;
        document.querySelector('[data-type="30d"]').textContent = `₿${values['30d']}`;
        document.querySelector('[data-type="1y"]').textContent = `₿${values['1y']}`;

        // Update Changes
        updateChange('house-price-change', changes.current);
        updateChange('seven-days-change', changes['7d']);
        updateChange('thirty-days-change', changes['30d']);
        updateChange('one-year-change', changes['1y']);

        // Update dot color based on 24h change
        const dot = document.getElementById('house-price-dot');
        if (dot) {
            dot.style.backgroundColor = changes.current > 0 ? 'green' : changes.current < 0 ? 'red' : 'gray';
            dot.classList.add('active');
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById("current-house-btc").textContent = "Error loading data";
    }
}

function updateChange(elementId, change) {
    const element = document.getElementById(elementId);
    if (element) {
        const symbol = change > 0 ? '▲' : change < 0 ? '▼' : '■';
        const color = change > 0 ? 'green' : change < 0 ? 'red' : 'gray';
        element.textContent = `${Math.abs(change).toFixed(2)}% ${symbol}`;
        element.style.color = color;
    }
}

// Initialize and auto-update
setInterval(fetchAndDisplayHousePrices, CACHE_DURATION);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndDisplayHousePrices);
} else {
    fetchAndDisplayHousePrices();
}
