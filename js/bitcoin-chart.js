// Global chart instance
let myChart;
window.globalCurrentPrice = 0;

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000;
const priceCache = {
  current: { timestamp: 0, data: null },
  historical24h: { timestamp: 0, data: null },
  dailyHistory: { timestamp: 0, data: null }
};

// Helper for fallback fetch
async function fetchWithFallbackPage2(primaryUrl, fallbackUrl) {
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

function initializePriceChart() {
  const ctx = document.getElementById('myChart').getContext('2d');
  const gradientStroke = ctx.createLinearGradient(0, 0, 2000, 0);
  gradientStroke.addColorStop(0, 'rgba(255, 165, 0, 0.3)');
  gradientStroke.addColorStop(0.5, 'rgba(255, 140, 0, 0.5)');
  gradientStroke.addColorStop(1, 'rgba(255, 69, 0, 0.6)');

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Price USD',
        data: [],
        lineTension: 0,
        borderColor: 'rgba(255, 140, 0, 1)',
        backgroundColor: gradientStroke,
        borderWidth: 1,
        pointRadius: ctx => (ctx.dataIndex % 7 === 0 ? 3 : 0),
        pointHitRadius: 5
      }]
    },
    options: {
      legend: { display: false },
      plugins: {
        datalabels: false
      },
      tooltips: {
        callbacks: {
          title: (tooltipItems, data) => '📅 ' + data.labels[tooltipItems[0].index],
          label: tooltipItem =>
            '$' + parseFloat(tooltipItem.yLabel).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
        }
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false,
            callback: value => '$' + (value / 1000).toFixed(0) + 'k',
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 10
          },
          gridLines: {
            color: 'rgba(255, 255, 255, 0.03)',  // subtle transparency
            drawBorder: true,
            drawTicks: false,
            lineWidth: 1,
            borderDashOffset: 0,
            zeroLineColor: 'rgba(255, 255, 255, 0.03)',
            zeroLineWidth: 1
          }
        }],
        xAxes: [{
          ticks: {
            autoSkip: true,
            maxTicksLimit: 12,
            minRotation: 45,
            maxRotation: 45,
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 10
          },
          gridLines: {
            color: 'rgba(255, 255, 255, 0.03)',  // subtle transparency
            drawBorder: true,
            drawTicks: false,
            lineWidth: 1,
            borderDashOffset: 0
          }
        }]
      }
    }
  });
}

function isCacheValid(entry) {
  return Date.now() - entry.timestamp < CACHE_DURATION && entry.data !== null;
}

async function fetchDailyHistoricPrices() {
  if (isCacheValid(priceCache.dailyHistory)) return priceCache.dailyHistory.data;

  let dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 365);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  const promises = dates.map(date => {
    const ts = Math.floor(date.getTime() / 1000);
    const primary = `https://mempool.btcframe.com/api/v1/historical-price?currency=USD&timestamp=${ts}`;
    const fallback = `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${ts}`;

    return fetchWithFallbackPage2(primary, fallback)
      .then(data => {
        if (data && data.prices && data.prices.length > 0 && data.prices[0].USD != null) {
          return { date, value: data.prices[0].USD };
        }
        return null;
      })
      .catch(err => {
        console.error("Error fetching price for", date, err);
        return null;
      });
  });

  const results = await Promise.all(promises);
  const filtered = results.filter(r => r !== null);

  priceCache.dailyHistory = {
    timestamp: Date.now(),
    data: filtered
  };

  return filtered;
}

function updatePriceChart(dailyPrices) {
  dailyPrices.sort((a, b) => a.date - b.date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  if (
    dailyPrices.length === 0 ||
    dailyPrices[dailyPrices.length - 1].date.toISOString().split('T')[0] !== todayStr
  ) {
    dailyPrices.push({ date: today, value: window.globalCurrentPrice || 0 });
  }

  const labels = dailyPrices.map(d =>
    d.date.toISOString().split('T')[0].substring(5).replace('-', '.')
  );
  const values = dailyPrices.map(d => d.value);

  myChart.data.labels = labels;
  myChart.data.datasets[0].data = values;
  myChart.update();
}

async function updatePrice() {
  try {
    let data;

    if (isCacheValid(priceCache.current)) {
      data = priceCache.current.data;
    } else {
      data = await fetchWithFallbackPage2(
        'https://mempool.btcframe.com/api/v1/prices',
        'https://mempool.space/api/v1/prices'
      );
      priceCache.current = {
        timestamp: Date.now(),
        data
      };
    }

    console.log("Current price data:", data);
    const currentPrice = data && data.USD ? Math.floor(data.USD) : 0;
    const price24hr = await fetchPrice24HoursAgo();
    let priceChange = 0;
    if (price24hr && price24hr !== 0) {
      priceChange = ((currentPrice - price24hr) / price24hr * 100).toFixed(2);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLabel = today.toISOString().split('T')[0].substring(5).replace('-', '.');

    document.getElementById('current-price').innerText = `$${currentPrice.toLocaleString()}`;
    const changeColor = priceChange > 0 ? 'green' : priceChange < 0 ? 'red' : 'gray';
    const sign = priceChange > 0 ? '+' : '';
    const arrow = priceChange > 0 ? '▲' : priceChange < 0 ? '▼' : '■';

    document.getElementById('price-change').innerHTML =
      `<font color="${changeColor}">${sign}${priceChange}% <span class="arrow">${arrow}</span></font>`;
    document.getElementById('price-dot').style.backgroundColor = changeColor;

    const labels = myChart.data.labels;
    const dataset = myChart.data.datasets[0].data;
    if (labels.length > 0 && labels[labels.length - 1] === todayLabel) {
      dataset[dataset.length - 1] = currentPrice;
    } else {
      labels.push(todayLabel);
      dataset.push(currentPrice);
    }
    myChart.update();

    window.globalCurrentPrice = currentPrice;
  } catch (err) {
    console.error("Error updating price:", err);
  }
}

async function fetchPrice24HoursAgo() {
  if (isCacheValid(priceCache.historical24h)) {
    return priceCache.historical24h.data;
  }

  const ts = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const primary = `https://mempool.btcframe.com/api/v1/historical-price?currency=USD&timestamp=${ts}`;
  const fallback = `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${ts}`;

  try {
    const data = await fetchWithFallbackPage2(primary, fallback);
    if (data && data.prices && data.prices.length > 0) {
      priceCache.historical24h = {
        timestamp: Date.now(),
        data: data.prices[0].USD
      };
      return data.prices[0].USD;
    }
    return null;
  } catch (err) {
    console.error("Error fetching 24hr price:", err);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initializePriceChart();

  const dailyPrices = await fetchDailyHistoricPrices();
  updatePriceChart(dailyPrices);

  updatePrice();
  setInterval(updatePrice, 5 * 60 * 1000);
});
