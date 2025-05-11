const SATS_PER_BITCOIN = 100000000;
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const PRICE_ENDPOINT = 'https://mempool.space/api/v1/prices';
const PRICE_ENDPOINT_FALLBACK = 'https://mempool.space/api/v1/prices';

let satsPriceCache = {
  timestamp: 0,
  data: null
};

// Fallback fetch specific to Page 9
async function fetchWithFallbackPage9(primaryUrl, fallbackUrl) {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Primary failed: ${primaryUrl}`, err);
    try {
      const resFallback = await fetch(fallbackUrl);
      if (!resFallback.ok) throw new Error(`Fallback failed: ${resFallback.status}`);
      return await resFallback.json();
    } catch (fallbackErr) {
      console.error(`Both primary and fallback APIs failed.`, fallbackErr);
      return null;
    }
  }
}

async function fetchPrice24HoursAgo() {
  const timestamp24Hr = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  try {
    const data = await fetchWithFallbackPage9(
      `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${timestamp24Hr}`,
      `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${timestamp24Hr}`
    );
    if (data && data.prices && data.prices.length > 0) {
      return data.prices[0].USD;
    }
    return null;
  } catch (error) {
    console.error("Error fetching 24hr historical price:", error);
    return null;
  }
}

function updateSatsusdUI(satsusd, change) {
  const satsusdContainer = document.querySelector('.satsusd-container');
  if (!satsusdContainer) return;
  satsusdContainer.innerHTML = '';

  const largeSquareCount = Math.floor(satsusd / 100);
  const remainingSmallSquares = satsusd % 100;

  for (let i = 0; i < largeSquareCount; i++) {
    const largeSquare = document.createElement('div');
    largeSquare.classList.add('satsusd-large-square');
    for (let j = 0; j < 100; j++) {
      const smallSquare = document.createElement('div');
      smallSquare.classList.add('satsusd-small-square');
      largeSquare.appendChild(smallSquare);
    }
    satsusdContainer.appendChild(largeSquare);
  }

  if (remainingSmallSquares > 0) {
    const largeSquare = document.createElement('div');
    largeSquare.classList.add('satsusd-large-square');
    for (let j = 0; j < remainingSmallSquares; j++) {
      const smallSquare = document.createElement('div');
      smallSquare.classList.add('satsusd-small-square');
      largeSquare.appendChild(smallSquare);
    }
    satsusdContainer.appendChild(largeSquare);
  }

  document.getElementById('satsusd-value').innerText = satsusd.toLocaleString();

  const changeValue = parseFloat(change);
  const changeColor = changeValue > 0 ? 'green' : changeValue < 0 ? 'red' : 'gray';
  const changeSign = changeValue > 0 ? '+' : '';
  const arrowDirection = changeValue > 0 ? '▲' : changeValue < 0 ? '▼' : '■';

  document.getElementById('satsusd-change').innerHTML =
    `<font color="${changeColor}">${changeSign}${changeValue.toFixed(2)}% <span class="arrow">${arrowDirection}</span></font>`;
  document.getElementById('satsusd-dot').style.backgroundColor = changeColor;
}

async function fetchAndUpdateSatsusd() {
  try {
    // Use cached data if still valid
    if (Date.now() - satsPriceCache.timestamp < PRICE_CACHE_DURATION && satsPriceCache.data) {
      const btcPrice = satsPriceCache.data.USD;
      const oldPrice = await fetchPrice24HoursAgo();
      let priceChange = 0;
      if (oldPrice && oldPrice !== 0) {
        priceChange = ((btcPrice - oldPrice) / oldPrice) * 100;
      }
      const satsPerDollar = Math.floor(SATS_PER_BITCOIN / btcPrice);
      updateSatsusdUI(satsPerDollar, priceChange);
      return;
    }

    // Fetch fresh price with fallback
    const data = await fetchWithFallbackPage9(PRICE_ENDPOINT, PRICE_ENDPOINT_FALLBACK);
    if (!data || !data.USD) {
      throw new Error("Invalid BTC price data");
    }

    satsPriceCache = {
      timestamp: Date.now(),
      data: data
    };

    const btcPrice = data.USD;
    const oldPrice = await fetchPrice24HoursAgo();
    let priceChange = 0;
    if (oldPrice && oldPrice !== 0) {
      priceChange = ((btcPrice - oldPrice) / oldPrice) * 100;
    }

    const satsPerDollar = Math.floor(SATS_PER_BITCOIN / btcPrice);
    updateSatsusdUI(satsPerDollar, priceChange);
  } catch (error) {
    console.error('Error fetching sats per dollar data:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndUpdateSatsusd();
  setInterval(fetchAndUpdateSatsusd, UPDATE_INTERVAL);
});

const observer9 = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.target.id === 'page9' &&
      mutation.type === 'attributes' &&
      mutation.attributeName === 'class'
    ) {
      if (mutation.target.classList.contains('active')) {
        fetchAndUpdateSatsusd();
      }
    }
  });
});

observer9.observe(document.getElementById('page9'), {
  attributes: true,
  attributeFilter: ['class']
});
