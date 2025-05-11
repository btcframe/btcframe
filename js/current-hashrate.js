let hashrateChart;
let globalCurrentHashrate = 0;
let globalChartDate = new Date().toISOString().split("T")[0].substring(5).replace("-", ".");

const HASHRATE_ENDPOINT = 'https://mempool.btcframe.com/api/v1/mining/hashrate/365d';
const RECENT_HASHRATE_ENDPOINT = 'https://mempool.btcframe.com/api/v1/mining/hashrate/3d';
const HASHRATE_ENDPOINT_FALLBACK = 'https://mempool.space/api/v1/mining/hashrate/365d';
const RECENT_HASHRATE_ENDPOINT_FALLBACK = 'https://mempool.space/api/v1/mining/hashrate/3d';

// Fallback fetch specific to Page 5
async function fetchWithFallbackPage5(primaryUrl, fallbackUrl) {
  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Primary failed: ${primaryUrl}`, err);
    try {
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) throw new Error(`Fallback failed: ${fallbackRes.status}`);
      return await fallbackRes.json();
    } catch (fallbackErr) {
      console.error(`Both primary and fallback APIs failed.`, fallbackErr);
      return null;
    }
  }
}

function formatHashrate(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} ZH/s`;
  } else {
    return `${value.toFixed(2)} EH/s`;
  }
}

function initializeHashrateChart() {
  const ctx = document.getElementById('hashrateChart').getContext('2d');

  const gradientStroke = ctx.createLinearGradient(0, 0, 2000, 0);
  gradientStroke.addColorStop(0, 'rgba(255, 165, 0, .3)');
  gradientStroke.addColorStop(0.5, 'rgba(255, 140, 0, .5)');
  gradientStroke.addColorStop(1, 'rgba(255, 69, 0, .6)');

  const gradientRainbow = ctx.createLinearGradient(0, 0, 2000, 0);
  gradientRainbow.addColorStop(0, 'green');
  gradientRainbow.addColorStop(0.3, 'yellow');
  gradientRainbow.addColorStop(0.6, 'orange');
  gradientRainbow.addColorStop(1, 'red');

  hashrateChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Hashrate EH/s',
        data: [],
        lineTension: 0,
        borderColor: 'rgba(255, 140, 0, 1)',
        backgroundColor: gradientStroke,
        borderWidth: 1,
        pointRadius: 3,
        pointHitRadius: 5,
        fill: true
      }, {
        label: '30d Moving Average',
        data: [],
        lineTension: 0,
        borderColor: gradientRainbow,
        borderWidth: 3,
        pointRadius: 0,
        pointHitRadius: 5,
        fill: false
      }]
    },
    options: {
      legend: { display: false },
      plugins: {
        datalabels: false
      },
      tooltips: {
        callbacks: {
          title: function (tooltipItems, data) {
            return '📅 ' + data.labels[tooltipItems[0].index];
          },
          label: function (tooltipItem, data) {
            const value = tooltipItem.yLabel;
            if (value >= 1000) {
              return `${(value / 1000).toFixed(2)} ZH/s`;
            } else {
              return `${value.toFixed(2).replace(/\.00$/, '')} EH/s`;
            }
          }
        }
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Total Daily Hash Rate',
            fontColor: 'rgba(255, 255, 255, 0.7)'
          },
          ticks: {
            beginAtZero: false,
            callback: function (value) {
              if (value >= 1000) {
                return `${(value / 1000).toFixed(2)} ZH/s`;
              } else {
                return `${value.toFixed(2).replace(/\.00$/, '')} EH/s`;
              }
            },
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 10
          },
          gridLines: {
            color: 'rgba(255, 255, 255, 0.03)',
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
            autoSkip: false,
            callback: function (value, index) {
              return index % 30 === 0 ? value : null;
            },
            maxRotation: 40,
            minRotation: 40,
            fontColor: 'rgba(255, 255, 255, 0.7)',
            padding: 10
          },
          gridLines: {
            color: 'rgba(255, 255, 255, 0.03)',
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

function calculateMovingAverage(data, windowSize) {
  let movingAverages = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      movingAverages.push(null);
    } else {
      let windowData = data.slice(i - windowSize + 1, i + 1);
      let average = windowData.reduce((sum, value) => sum + value, 0) / windowSize;
      movingAverages.push(average);
    }
  }
  return movingAverages;
}

async function fetchHistoricHashrates() {
  try {
    const cacheKey = 'historicHashrates';
    const cacheTimestampKey = 'historicHashratesTimestamp';
    const cacheExpiry = 5 * 60 * 1000;
    const now = Date.now();
    let cached = localStorage.getItem(cacheKey);
    let timestamp = localStorage.getItem(cacheTimestampKey);
    if (cached && timestamp && (now - parseInt(timestamp, 10) < cacheExpiry)) {
      return JSON.parse(cached);
    }

    const data = await fetchWithFallbackPage5(HASHRATE_ENDPOINT, HASHRATE_ENDPOINT_FALLBACK);
    if (!data || !data.hashrates || !Array.isArray(data.hashrates)) {
      throw new Error('Expected an array for historic hashrates data');
    }

    const hashrates = data.hashrates.map(item => ({
      date: new Date(item.timestamp * 1000),
      value: item.avgHashrate / 1e18
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filteredHashrates = hashrates.filter(hashrate => hashrate.date >= oneYearAgo);

    const result = filteredHashrates.map(hashrate => ({
      date: hashrate.date.toISOString().split("T")[0].substring(5).replace("-", "."),
      value: hashrate.value
    }));
    localStorage.setItem(cacheKey, JSON.stringify(result));
    localStorage.setItem(cacheTimestampKey, now.toString());
    return result;
  } catch (error) {
    console.error('Error fetching historic hashrates:', error);
    return [];
  }
}

function updateHashrateChart(hashrates) {
  const labels = hashrates.map(hashrate => hashrate.date);
  const values = hashrates.map(hashrate => hashrate.value);
  const movingAverages = calculateMovingAverage(values, 30);

  hashrateChart.data.labels = labels;
  hashrateChart.data.datasets[0].data = values;
  hashrateChart.data.datasets[1].data = movingAverages;
  hashrateChart.update();
}

async function updateCurrentHashrate() {
  try {
    const cacheKey = 'recentHashrate';
    const cacheTimestampKey = 'recentHashrateTimestamp';
    const cacheExpiry = 5 * 60 * 1000;
    const now = Date.now();
    let data;
    let cached = localStorage.getItem(cacheKey);
    let timestamp = localStorage.getItem(cacheTimestampKey);
    if (cached && timestamp && (now - parseInt(timestamp, 10) < cacheExpiry)) {
      data = JSON.parse(cached);
    } else {
      data = await fetchWithFallbackPage5(RECENT_HASHRATE_ENDPOINT, RECENT_HASHRATE_ENDPOINT_FALLBACK);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(cacheTimestampKey, now.toString());
    }

    const currentHashrate = data.currentHashrate / 1e18;
    globalCurrentHashrate = parseFloat(currentHashrate.toFixed(2));
    document.getElementById('current-hashrate').innerText = formatHashrate(globalCurrentHashrate);

    const hashrates = data.hashrates;
    let oneDayAgoHashrate;
    if (hashrates && hashrates.length >= 2) {
      oneDayAgoHashrate = hashrates[hashrates.length - 2].avgHashrate / 1e18;
    } else {
      oneDayAgoHashrate = currentHashrate;
    }
    const hashrateChange = ((currentHashrate - oneDayAgoHashrate) / oneDayAgoHashrate) * 100;
    const hashrateChangeColor = hashrateChange > 0 ? 'green' : hashrateChange < 0 ? 'red' : 'gray';
    const hashrateChangeSign = hashrateChange > 0 ? '+' : '';
    const arrowDirection = hashrateChange > 0 ? '▲' : hashrateChange < 0 ? '▼' : '■';
    document.getElementById('hashrate-change').innerHTML = `<font color="${hashrateChangeColor}">${hashrateChangeSign}${hashrateChange.toFixed(2)}% <span class="arrow">${arrowDirection}</span></font>`;
    document.getElementById('hashrate-dot').style.backgroundColor = hashrateChangeColor;

    globalChartDate = new Date().toISOString().split("T")[0].substring(5).replace("-", ".");
    if (hashrateChart.data.labels.length === 0 || hashrateChart.data.labels[hashrateChart.data.labels.length - 1] !== globalChartDate) {
      hashrateChart.data.labels.push(globalChartDate);
      hashrateChart.data.datasets[0].data.push(globalCurrentHashrate);
      if (hashrateChart.data.labels.length > 1) {
        hashrateChart.data.labels.shift();
        hashrateChart.data.datasets[0].data.shift();
      }
    } else {
      hashrateChart.data.datasets[0].data[hashrateChart.data.datasets[0].data.length - 1] = globalCurrentHashrate;
    }
    hashrateChart.update();
  } catch (error) {
    console.error('Error updating current hashrate:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('hashrateChart')) {
    initializeHashrateChart();
    fetchHistoricHashrates().then(hashrates => {
      updateHashrateChart(hashrates);
    });
    updateCurrentHashrate();
    setInterval(updateCurrentHashrate, 5 * 60 * 1000);
  }
});

const page5Observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (
      mutation.target.id === 'page5' &&
      mutation.type === 'attributes' &&
      mutation.attributeName === 'class'
    ) {
      if (mutation.target.classList.contains('active')) {
        if (!hashrateChart) {
          initializeHashrateChart();
        }
        updateCurrentHashrate();
      }
    }
  });
});

if (document.getElementById('page5')) {
  page5Observer.observe(document.getElementById('page5'), {
    attributes: true,
    attributeFilter: ['class']
  });
}
