// Primary API endpoints (BTC Frame Private Node)
const ENDPOINTS = {
  BITCOIN_PRICE: 'https://mempool.space/api/v1/prices',
  BLOCK_HEIGHT: 'https://mempool.space/api/blocks/tip/height',
  FEES: 'https://mempool.space/api/v1/fees/recommended',
  HASHRATE: 'https://mempool.space/api/v1/mining/hashrate/3d',
  DIFFICULTY: 'https://mempool.space/api/v1/difficulty-adjustment'
};

// Fallback API endpoints (Public mempool.space)
const FALLBACK_ENDPOINTS = {
  BITCOIN_PRICE: 'https://mempool.space/api/v1/prices',
  BLOCK_HEIGHT: 'https://mempool.space/api/blocks/tip/height',
  FEES: 'https://mempool.space/api/v1/fees/recommended',
  HASHRATE: 'https://mempool.space/api/v1/mining/hashrate/3d',
  DIFFICULTY: 'https://mempool.space/api/v1/difficulty-adjustment'
};

// Cache setup
const CACHE_KEYS = {
  PRICE: 'btcFrameCache_price',
  BLOCK: 'btcFrameCache_block',
  FEES: 'btcFrameCache_fees',
  HASH: 'btcFrameCache_hash',
  DIFFICULTY: 'btcFrameCache_difficulty'
};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCachedData(cacheKey) {
  const cached = localStorage.getItem(cacheKey);
  if (!cached) return null;
  try {
    const data = JSON.parse(cached);
    if (Date.now() - data.timestamp < CACHE_EXPIRY) {
      return data.data;
    }
  } catch (e) {}
  return null;
}

function setCachedData(cacheKey, data) {
  localStorage.setItem(cacheKey, JSON.stringify({
    data: data,
    timestamp: Date.now()
  }));
}

// Format hashrate (EH/s or ZH/s)
function formatHashrate(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} ZH/s`;
  } else {
    return `${value.toFixed(2)} EH/s`;
  }
}

// Universal fetch with fallback
async function fetchWithFallbackPage1(primaryUrl, fallbackUrl, parse = 'json') {
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

// Fetch functions with cache + fallback
async function fetchBitcoinPrice() {
  const cached = getCachedData(CACHE_KEYS.PRICE);
  if (cached) return cached;
  const data = await fetchWithFallbackPage1(ENDPOINTS.BITCOIN_PRICE, FALLBACK_ENDPOINTS.BITCOIN_PRICE);
  if (data) setCachedData(CACHE_KEYS.PRICE, data);
  return data;
}

async function fetchBlockHeight() {
  const cached = getCachedData(CACHE_KEYS.BLOCK);
  if (cached) return cached;
  const data = await fetchWithFallbackPage1(ENDPOINTS.BLOCK_HEIGHT, FALLBACK_ENDPOINTS.BLOCK_HEIGHT, 'text');
  if (data) setCachedData(CACHE_KEYS.BLOCK, data);
  return data;
}

async function fetchFees() {
  const cached = getCachedData(CACHE_KEYS.FEES);
  if (cached) return cached;
  const data = await fetchWithFallbackPage1(ENDPOINTS.FEES, FALLBACK_ENDPOINTS.FEES);
  if (data) setCachedData(CACHE_KEYS.FEES, data);
  return data;
}

async function fetchHashrate() {
  const cached = getCachedData(CACHE_KEYS.HASH);
  if (cached) return cached;
  const data = await fetchWithFallbackPage1(ENDPOINTS.HASHRATE, FALLBACK_ENDPOINTS.HASHRATE);
  if (data) setCachedData(CACHE_KEYS.HASH, data);
  return data;
}

async function fetchDifficulty() {
  const cached = getCachedData(CACHE_KEYS.DIFFICULTY);
  if (cached) return cached;
  const data = await fetchWithFallbackPage1(ENDPOINTS.DIFFICULTY, FALLBACK_ENDPOINTS.DIFFICULTY);
  if (data) setCachedData(CACHE_KEYS.DIFFICULTY, data);
  return data;
}

// Circulating supply calculator
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

// Format market cap for UI
function formatMarketCap(marketCap) {
  if (marketCap >= 1e12) {
    return `${(marketCap / 1e12).toFixed(2)}T`;
  } else if (marketCap >= 1e9) {
    return `${(marketCap / 1e9).toFixed(2)}B`;
  } else if (marketCap >= 1e6) {
    return `${(marketCap / 1e6).toFixed(2)}M`;
  } else {
    return marketCap.toLocaleString();
  }
}

// Fetch and update UI
async function fetchPage1Data() {
  try {
    const [btcData, blockData, feeData, hashData, difficultyData] = await Promise.all([
      fetchBitcoinPrice(),
      fetchBlockHeight(),
      fetchFees(),
      fetchHashrate(),
      fetchDifficulty()
    ]);

    updatePage1UI({
      btcData: btcData || {},
      blockData: blockData || "",
      feeData: feeData || {},
      hashData: hashData || {},
      difficultyData: difficultyData || {}
    });

    if (btcData && btcData.USD) {
      window.globalCurrentPrice = Math.floor(btcData.USD);
    }
    if (hashData && hashData.currentHashrate) {
      window.globalCurrentHashrate = (hashData.currentHashrate / 1e18).toFixed(2);
    }
  } catch (error) {
    console.error('Error in fetchPage1Data:', error);
  }
}

// UI updater
function updatePage1UI(data) {
  const { btcData, blockData, feeData, hashData, difficultyData } = data;

  if (btcData && btcData.USD) {
    const currentPrice = Math.floor(btcData.USD);
    document.getElementById('btc-usd').innerText = `$${currentPrice.toLocaleString()}`;
    const satsPerDollar = Math.floor(100000000 / currentPrice);
    document.getElementById('sats-per-dollar').innerText = satsPerDollar.toLocaleString();
  }

  if (feeData && feeData.fastestFee) {
    document.getElementById('avg-tx-fee').innerText = feeData.fastestFee;
  }

  if (blockData) {
    document.getElementById('block-height').innerText = blockData;
  }

  if (hashData && hashData.currentHashrate) {
    const currentHashrate = (hashData.currentHashrate / 1e18).toFixed(2);
    document.getElementById('hash-rate').innerText = formatHashrate(parseFloat(currentHashrate));
  }

  if (hashData && hashData.currentDifficulty) {
    document.getElementById('difficulty').innerText = 
      `${(hashData.currentDifficulty / 1e12).toFixed(2)} T`;
  }

  if (btcData && btcData.USD && blockData) {
    const blockHeight = parseInt(blockData, 10);
    const circulatingSupply = computeCirculatingSupply(blockHeight);
    document.getElementById('circulating-supply').innerHTML =
      `${Math.floor(circulatingSupply).toLocaleString()}<span>∞/21m</span>`;
    const marketCap = circulatingSupply * Math.floor(btcData.USD);
    document.getElementById('market-cap').innerText = `$${formatMarketCap(marketCap)}`;
  }

  if (difficultyData) {
    updateDifficultyAdjustment(difficultyData);
  }
}

function updateDifficultyAdjustment(difficultyData) {
  const progressCircle = document.querySelector('.progress-bar');
  const progressPercent = difficultyData.progressPercent.toFixed(2);
  progressCircle.style.background = `conic-gradient(#f39c12 0% ${progressPercent}%, #444 ${progressPercent}% 100%)`;
  progressCircle.querySelector('span').textContent = `${progressPercent}%`;

  document.getElementById('remaining-blocks').innerText =
    `${difficultyData.remainingBlocks.toLocaleString()} blocks remaining`;

  const nextAdjustment = Math.abs(difficultyData.difficultyChange).toFixed(2);
  const prevAdjustment = Math.abs(difficultyData.previousRetarget).toFixed(2);
  const nextAdjustmentArrow = difficultyData.difficultyChange > 0 ? '▲' : '▼';
  const prevAdjustmentArrow = difficultyData.previousRetarget > 0 ? '▲' : '▼';
  const nextAdjustmentSign = difficultyData.difficultyChange > 0 ? '+' : '−';
  const prevAdjustmentSign = difficultyData.previousRetarget > 0 ? '+' : '−';

  const nextElement = document.getElementById('next-adjustment-value');
  const prevElement = document.getElementById('prev-adjustment-value');

  nextElement.innerText = `${nextAdjustmentSign}${nextAdjustment}% ${nextAdjustmentArrow}`;
  nextElement.style.color = difficultyData.difficultyChange < 0 ? 'red' : 'green';

  prevElement.innerText = `${prevAdjustmentSign}${prevAdjustment}% ${prevAdjustmentArrow}`;
  prevElement.style.color = difficultyData.previousRetarget < 0 ? 'red' : 'green';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  fetchPage1Data();
  setInterval(fetchPage1Data, CACHE_EXPIRY);
});
