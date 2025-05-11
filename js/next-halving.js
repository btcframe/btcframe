// Constants for halving calculations
const BLOCKS_PER_HALVING = 210000;
const AVERAGE_BLOCK_TIME_MINUTES = 10;
const API_ENDPOINT = 'https://mempool.btcframe.com/api/blocks/tip/height';
const API_ENDPOINT_FALLBACK = 'https://mempool.space/api/blocks/tip/height';

// Cache configuration for halving info
const HALVING_CACHE_EXPIRY = 5 * 60 * 1000;
const HALVING_CACHE_KEY = 'halvingBlockHeightCache';
const HALVING_CACHE_TIMESTAMP_KEY = 'halvingBlockHeightCacheTimestamp';

// Format date in MM/DD/YYYY HH:MM:SS
function formatDateToMMDDYYYY(date) {
  const day = ('0' + date.getDate()).slice(-2);
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const year = date.getFullYear();
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

// Update split-flap block display
function updateSplitFlapDisplay(number) {
  const blocksRemainingElem = document.getElementById('blocks-remaining');
  if (!blocksRemainingElem) return;

  const blocksRemainingStr = number.toLocaleString('en-US').padStart(7, '0');
  blocksRemainingElem.innerHTML = '';

  blocksRemainingStr.split('').forEach(char => {
    const span = document.createElement('span');
    span.classList.add('digit');
    span.dataset.kind = 'digit';
    span.textContent = char;
    blocksRemainingElem.appendChild(span);
  });
}

// Update halving progress visual
function updateHalvingProgress(percentage) {
  const circle = document.querySelector('.halving-progress-circle');
  const percentageText = document.getElementById('halving-percentage-text');

  if (circle && percentageText) {
    circle.style.background = `conic-gradient(#ffae42 0% ${percentage}%, #444 ${percentage}% 100%)`;
    percentageText.innerText = `${percentage.toFixed(2)}%`;
  }
}

// --- Fallback helper just for Page 4 ---
async function fetchWithFallbackPage4(primaryUrl, fallbackUrl) {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`Primary API failed: ${primaryUrl}`, err);
    try {
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) throw new Error(`Fallback failed: ${fallbackRes.status}`);
      return await fallbackRes.text();
    } catch (fallbackErr) {
      console.error(`Both primary and fallback APIs failed.`, fallbackErr);
      return null;
    }
  }
}

// Fetch block height with caching + fallback
async function fetchBlockHeight() {
  const now = Date.now();
  const cachedValue = localStorage.getItem(HALVING_CACHE_KEY);
  const cachedTimestamp = localStorage.getItem(HALVING_CACHE_TIMESTAMP_KEY);

  if (cachedValue && cachedTimestamp && now - parseInt(cachedTimestamp, 10) < HALVING_CACHE_EXPIRY) {
    return parseInt(cachedValue, 10);
  }

  const text = await fetchWithFallbackPage4(API_ENDPOINT, API_ENDPOINT_FALLBACK);
  if (!text) throw new Error('Could not fetch block height');

  const blockHeight = parseInt(text, 10);
  if (isNaN(blockHeight)) throw new Error('Invalid block height');

  localStorage.setItem(HALVING_CACHE_KEY, blockHeight.toString());
  localStorage.setItem(HALVING_CACHE_TIMESTAMP_KEY, now.toString());

  return blockHeight;
}

// Calculate halving stats and update UI
async function updateHalvingInfo() {
  try {
    const currentBlockHeight = await fetchBlockHeight();
    console.log('Current block height:', currentBlockHeight);

    if (!currentBlockHeight || isNaN(currentBlockHeight)) {
      throw new Error('Invalid block height received');
    }

    const blocksRemaining = BLOCKS_PER_HALVING - (currentBlockHeight % BLOCKS_PER_HALVING);
    const percentage = ((currentBlockHeight % BLOCKS_PER_HALVING) / BLOCKS_PER_HALVING) * 100;
    const remainingTimeMinutes = blocksRemaining * AVERAGE_BLOCK_TIME_MINUTES;
    const estimatedHalvingDate = new Date(Date.now() + remainingTimeMinutes * 60000);

    updateSplitFlapDisplay(blocksRemaining);
    updateHalvingProgress(percentage);

    const dynamicDateElem = document.getElementById('dynamic-date');
    if (dynamicDateElem) {
      dynamicDateElem.innerText = `≈${formatDateToMMDDYYYY(estimatedHalvingDate)}`;
    }

    console.log('Update completed:', {
      blocksRemaining,
      percentage,
      estimatedDate: estimatedHalvingDate
    });
  } catch (error) {
    console.error('Error updating halving information:', error);
  }
}

// Initialize halving info fetch + interval
function initializePage() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateHalvingInfo);
  } else {
    updateHalvingInfo();
  }
  setInterval(updateHalvingInfo, 5 * 60 * 1000);
}

// Set up mutation observer to detect visibility
function setupObserver() {
  const page4 = document.getElementById('page4');
  if (!page4) {
    console.error('Page 4 element not found');
    return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.target.id === 'page4' &&
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        if (mutation.target.classList.contains('active')) {
          updateHalvingInfo();
        }
      }
    });
  });

  observer.observe(page4, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// Kick things off
initializePage();
setupObserver();
