let isFlapperInitialized = false;
const CURRENCY_ENDPOINT = 'https://mempool.btcframe.com/api/v1/prices';
const CURRENCY_ENDPOINT_FALLBACK = 'https://mempool.space/api/v1/prices';

const FLAPPER_CACHE_EXPIRY = 5 * 60 * 1000;
const FLAPPER_CACHE_KEY = 'flapperCache';
const FLAPPER_CACHE_TIMESTAMP_KEY = 'flapperCacheTimestamp';

function initializeFlappers() {
  $('.flapper').remove();
  $('.display').flapper({ width: 11, align: 'right' });
}

function updateDotColor(currency, change) {
  const color = change > 0 ? 'green' : change < 0 ? 'red' : 'gray';
  document.getElementById(`price-dot-${currency}`).style.backgroundColor = color;
}

// --- NEW: Fallback fetch helper ---
async function fetchWithFallback(primaryUrl, fallbackUrl) {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Primary API failed: ${primaryUrl}`, err);
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

async function fetchPrice24HoursAgoForCurrency(currency) {
  const timestamp24Hr = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const HISTORICAL_CACHE_EXPIRY = 5 * 60 * 1000;
  const HISTORICAL_CACHE_KEY = `flapperHistoricalPriceCache_${currency}`;
  const HISTORICAL_CACHE_TIMESTAMP_KEY = `flapperHistoricalPriceCacheTimestamp_${currency}`;

  try {
    const now = Date.now();
    const cachedPrice = localStorage.getItem(HISTORICAL_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(HISTORICAL_CACHE_TIMESTAMP_KEY);
    if (cachedPrice && cachedTimestamp && now - parseInt(cachedTimestamp, 10) < HISTORICAL_CACHE_EXPIRY) {
      return JSON.parse(cachedPrice);
    }

    const primary = `https://mempool.btcframe.com/api/v1/historical-price?currency=${currency}&timestamp=${timestamp24Hr}`;
    const fallback = `https://mempool.space/api/v1/historical-price?currency=${currency}&timestamp=${timestamp24Hr}`;
    const data = await fetchWithFallback(primary, fallback);

    if (data && data.prices && data.prices.length > 0) {
      const price = data.prices[0][currency];
      localStorage.setItem(HISTORICAL_CACHE_KEY, JSON.stringify(price));
      localStorage.setItem(HISTORICAL_CACHE_TIMESTAMP_KEY, now.toString());
      return price;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching 24hr historical price for ${currency}:`, error);
    return null;
  }
}

async function fetchFlapperData() {
  try {
    const now = Date.now();
    let data;
    const cachedData = localStorage.getItem(FLAPPER_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(FLAPPER_CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp && now - parseInt(cachedTimestamp, 10) < FLAPPER_CACHE_EXPIRY) {
      data = JSON.parse(cachedData);
    } else {
      data = await fetchWithFallback(CURRENCY_ENDPOINT, CURRENCY_ENDPOINT_FALLBACK);
      if (data) {
        localStorage.setItem(FLAPPER_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(FLAPPER_CACHE_TIMESTAMP_KEY, now.toString());
      }
    }

    if (!data) return;

    const btcUSD = Math.floor(data.USD).toLocaleString();
    const btcEUR = Math.floor(data.EUR).toLocaleString();
    const btcGBP = Math.floor(data.GBP).toLocaleString();
    const btcCAD = Math.floor(data.CAD).toLocaleString();
    const btcCHF = Math.floor(data.CHF).toLocaleString();
    const btcAUD = Math.floor(data.AUD).toLocaleString();

    $('#display-1').val(`${btcUSD} USD`).change();
    $('#display-2').val(`${btcEUR} EUR`).change();
    $('#display-3').val(`${btcGBP} GBP`).change();
    $('#display-4').val(`${btcCAD} CAD`).change();
    $('#display-5').val(`${btcCHF} CHF`).change();
    $('#display-6').val(`${btcAUD} AUD`).change();

    const [price24USD, price24EUR, price24GBP, price24CAD, price24CHF, price24AUD] = await Promise.all([
      fetchPrice24HoursAgoForCurrency('USD'),
      fetchPrice24HoursAgoForCurrency('EUR'),
      fetchPrice24HoursAgoForCurrency('GBP'),
      fetchPrice24HoursAgoForCurrency('CAD'),
      fetchPrice24HoursAgoForCurrency('CHF'),
      fetchPrice24HoursAgoForCurrency('AUD')
    ]);

    const changeUSD = price24USD ? ((data.USD - price24USD) / price24USD * 100).toFixed(2) : 0;
    const changeEUR = price24EUR ? ((data.EUR - price24EUR) / price24EUR * 100).toFixed(2) : 0;
    const changeGBP = price24GBP ? ((data.GBP - price24GBP) / price24GBP * 100).toFixed(2) : 0;
    const changeCAD = price24CAD ? ((data.CAD - price24CAD) / price24CAD * 100).toFixed(2) : 0;
    const changeCHF = price24CHF ? ((data.CHF - price24CHF) / price24CHF * 100).toFixed(2) : 0;
    const changeAUD = price24AUD ? ((data.AUD - price24AUD) / price24AUD * 100).toFixed(2) : 0;

    updateDotColor('usd', changeUSD);
    updateDotColor('eur', changeEUR);
    updateDotColor('gbp', changeGBP);
    updateDotColor('cad', changeCAD);
    updateDotColor('chf', changeCHF);
    updateDotColor('aud', changeAUD);
  } catch (error) {
    console.error('Error fetching flapper data:', error);
  }
}

function handlePage3Visibility() {
  const page3 = document.getElementById('page3');
  if (page3.classList.contains('active')) {
    if (!isFlapperInitialized) {
      initializeFlappers();
      isFlapperInitialized = true;
    }
    fetchFlapperData();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page3').classList.contains('active')) {
    initializeFlappers();
    isFlapperInitialized = true;
    fetchFlapperData();
  }
  setInterval(() => {
    if (document.getElementById('page3').classList.contains('active')) {
      fetchFlapperData();
    }
  }, 300000);
});

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.target.id === 'page3' &&
      mutation.type === 'attributes' &&
      mutation.attributeName === 'class'
    ) {
      handlePage3Visibility();
    }
  });
});

observer.observe(document.getElementById('page3'), { attributes: true, attributeFilter: ['class'] });

// XXXL Flappers for 2K monitors
document.addEventListener('DOMContentLoaded', function () {
  if (window.innerWidth >= 2000 && window.innerWidth <= 2600) {
    const displays = document.querySelectorAll('.display.XXL');
    displays.forEach(display => {
      display.classList.remove('XXL');
      display.classList.add('XXXL');
      if (window.$ && $.fn.flapper) {
        $(display).flapper({
          width: 130,
          height: 173,
          class_size: 'XXXL'
        });
      }
    });
  }
});
