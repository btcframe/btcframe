const SATSUSD_CACHE_KEY = "btcFrameCacheSatsusd";
const SATSUSD_CACHE_EXPIRY = 449000; // 449 seconds in milliseconds

function updateSatsusdUI(satsusd, change) {
  const satsusdContainer = document.querySelector(".satsusd-container");
  if (!satsusdContainer) {
    console.error("Error: satsusd-container not found");
    return;
  }

  satsusdContainer.innerHTML = ""; // Clear previous content

  const largeSquareCount = Math.floor(satsusd / 100);
  const remainingSmallSquares = satsusd % 100;

  for (let i = 0; i < largeSquareCount; i++) {
    const largeSquare = document.createElement("div");
    largeSquare.classList.add("satsusd-large-square");
    for (let j = 0; j < 100; j++) {
      const smallSquare = document.createElement("div");
      smallSquare.classList.add("satsusd-small-square");
      largeSquare.appendChild(smallSquare);
    }
    satsusdContainer.appendChild(largeSquare);
  }

  if (remainingSmallSquares > 0) {
    const largeSquare = document.createElement("div");
    largeSquare.classList.add("satsusd-large-square");
    for (let j = 0; j < remainingSmallSquares; j++) {
      const smallSquare = document.createElement("div");
      smallSquare.classList.add("satsusd-small-square");
      largeSquare.appendChild(smallSquare);
    }
    satsusdContainer.appendChild(largeSquare);
  }

  const satsusdValueElement = document.getElementById("satsusd-value");
  const satsusdChangeElement = document.getElementById("satsusd-change");
  const satsusdDot = document.getElementById("satsusd-dot");

  if (satsusdValueElement && satsusdChangeElement && satsusdDot) {
    satsusdValueElement.innerText = satsusd.toFixed(0);

    const changeColor = change > 0 ? "green" : change < 0 ? "red" : "gray";
    const changeSign = change > 0 ? "+" : "";
    const arrowDirection = change > 0 ? "▲" : change < 0 ? "▼" : "■";

    satsusdChangeElement.innerHTML = `<font color="${changeColor}">${changeSign}${change}% <span class="arrow">${arrowDirection}</span></font>`;
    satsusdDot.style.backgroundColor = changeColor;
  } else {
    console.error("Error: satsusd-value, satsusd-change, or satsusd-dot not found");
  }
}

async function fetchSatsusdData() {
  try {
    const cachedData = JSON.parse(localStorage.getItem(SATSUSD_CACHE_KEY));
    const now = new Date().getTime();

    if (cachedData && now - cachedData.timestamp < SATSUSD_CACHE_EXPIRY) {
      updateSatsusdUI(cachedData.satsusd, cachedData.change);
      return;
    }

    if (typeof globalCurrentPrice !== 'undefined' && typeof globalChange !== 'undefined') {
      let satsusd = 100000000 / globalCurrentPrice;

      const data = {
        satsusd,
        change: globalChange
      };

      localStorage.setItem(SATSUSD_CACHE_KEY, JSON.stringify({ satsusd, change: globalChange, timestamp: now }));
      updateSatsusdUI(satsusd, globalChange);
    } else {
      console.error("Global variables for current price and change are not defined.");
    }
  } catch (error) {
    console.error("Error fetching satsusd data:", error);
    if (localStorage.getItem(SATSUSD_CACHE_KEY)) {
      const cachedData = JSON.parse(localStorage.getItem(SATSUSD_CACHE_KEY));
      updateSatsusdUI(cachedData.satsusd, cachedData.change);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchSatsusdData();
  setInterval(fetchSatsusdData, SATSUSD_CACHE_EXPIRY);
});
