const MEMPOOL_API = 'https://mempool.btcframe.com/api/v1/historical-price';
const MEMPOOL_API_FALLBACK = 'https://mempool.space/api/v1/historical-price';
const GENESIS_DATE = new Date('2009-01-03');
const FUTURE_END_DATE = new Date('2028-01-07');
const CACHE_EXPIRY_TIME = 20 * 60 * 1000;

const POWER_LAW_PARAMS = {
    a: 1.2e-17,
    b: 5.98,
    t0: Math.floor(GENESIS_DATE.getTime() / (1000 * 60 * 60 * 24)),
    bands: {
        top2: 10.0,
        top1: 4.0,
        bottom1: 0.25,
        bottom2: 0.1
    }
};

// Scoped fallback fetch
async function fetchWithFallbackPage19(primaryUrl, fallbackUrl, parse = 'json') {
    try {
        const res = await fetch(primaryUrl);
        if (!res.ok) throw new Error(`Primary failed: ${res.status}`);
        return parse === 'text' ? res.text() : res.json();
    } catch (err) {
        console.warn(`Primary failed: ${primaryUrl}`, err);
        try {
            const resFallback = await fetch(fallbackUrl);
            if (!resFallback.ok) throw new Error(`Fallback failed: ${resFallback.status}`);
            return parse === 'text' ? resFallback.text() : resFallback.json();
        } catch (fallbackErr) {
            console.error(`Both primary and fallback APIs failed.`, fallbackErr);
            return null;
        }
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function getCachedData(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(key);
        return null;
    }
    return data;
}

function setCachedData(key, data) {
    const payload = {
        data,
        timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(payload));
}

async function fetchCSVData() {
    const cacheKey = 'bitcoin_csv_data';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        console.log('Using cached CSV data');
        return cachedData;
    }

    try {
        const response = await fetch('./bitcoin_dataset.csv');
        if (!response.ok) throw new Error('Failed to fetch the CSV file.');

        const text = await response.text();
        const rows = text.trim().split('\n').slice(1);
        const data = rows.map(row => {
            const [date, price] = row.split(',');
            const formattedDate = new Date(date.trim()).toISOString().split('T')[0];
            return { date: formattedDate, price: parseFloat(price) };
        }).filter(entry => entry.date && !isNaN(entry.price));

        setCachedData(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error fetching or parsing the CSV file:', error);
        return [];
    }
}

async function fetchMempoolData() {
    const cacheKey = 'mempool_data';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        console.log('Using cached Mempool data');
        return cachedData;
    }

    try {
        const data = await fetchWithFallbackPage19(MEMPOOL_API, MEMPOOL_API_FALLBACK);
        if (!data || !Array.isArray(data.prices)) throw new Error('Invalid response format from Mempool');

        const processedData = data.prices
            .map(entry => ({
                date: new Date(entry.time * 1000).toISOString().split('T')[0],
                price: entry.USD
            }))
            .filter(entry => new Date(entry.date) >= new Date('2025-01-01'));

        setCachedData(cacheKey, processedData);
        return processedData;
    } catch (error) {
        console.error('Error fetching data from Mempool API:', error);
        return [];
    }
}

function aggregateByWeek(data) {
    const weeklyData = [];
    let currentWeek = null;
    let lastPoint = null;

    data.forEach(entry => {
        const date = new Date(entry.date);
        const week = `${date.getFullYear()}-${Math.ceil(date.getDate() / 7)}`;

        if (week !== currentWeek) {
            if (lastPoint) weeklyData.push(lastPoint);
            currentWeek = week;
        }
        lastPoint = entry;
    });

    if (lastPoint) weeklyData.push(lastPoint);
    return weeklyData;
}

function calculatePowerLawWithBands(weeklyPrices) {
    const lastDate = new Date(weeklyPrices[weeklyPrices.length - 1].date);
    const historicalIntervals = [];

    for (let i = 1; i < weeklyPrices.length; i++) {
        const date1 = new Date(weeklyPrices[i - 1].date);
        const date2 = new Date(weeklyPrices[i].date);
        historicalIntervals.push(Math.floor((date2 - date1) / (1000 * 60 * 60 * 24)));
    }

    const avgInterval = Math.floor(historicalIntervals.reduce((a, b) => a + b, 0) / historicalIntervals.length);
    const combinedData = [...weeklyPrices];
    let currentDate = new Date(lastDate);

    while (currentDate < FUTURE_END_DATE) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + avgInterval);
        if (nextDate <= FUTURE_END_DATE) {
            combinedData.push({ date: nextDate.toISOString().split('T')[0], price: null });
        }
        currentDate = nextDate;
    }

    return combinedData.map(entry => {
        const currentDate = new Date(entry.date);
        const t = Math.floor((currentDate.getTime() - GENESIS_DATE.getTime()) / (1000 * 60 * 60 * 24));
        const modelPrice = POWER_LAW_PARAMS.a * Math.pow(t, POWER_LAW_PARAMS.b);

        const bands = {
            top: modelPrice * POWER_LAW_PARAMS.bands.top2,
            upper: modelPrice * POWER_LAW_PARAMS.bands.top1,
            middle: modelPrice,
            lower: modelPrice * POWER_LAW_PARAMS.bands.bottom1,
            bottom: modelPrice * POWER_LAW_PARAMS.bands.bottom2
        };

        const deviation = entry.price ? (entry.price - modelPrice) / modelPrice : null;

        return {
            ...entry,
            modelPrice,
            bands,
            deviation: deviation ? Math.abs(deviation) : null,
            relativeDeviation: deviation
        };
    });
}

function getBandColor(bandName, opacity = 1) {
    const colors = {
        top: `rgba(255, 118, 118, ${opacity})`,
        upper: `rgba(243, 186, 128, ${opacity})`,
        middle: `rgba(71, 216, 149, ${opacity})`,
        lower: `rgba(126, 188, 230, ${opacity})`,
        bottom: `rgba(137, 128, 245, ${opacity})`
    };
    return colors[bandName];
}

function updateBandPrices(powerLawData) {
    let lastPriceIndex = powerLawData.findIndex(d => d.price === null) - 1;
    if (lastPriceIndex < 0) lastPriceIndex = powerLawData.length - 1;

    const currentData = powerLawData[lastPriceIndex];
    const bandPricesDiv = document.getElementById('bandPrices');
    const bands = [
        { name: 'Top Band', value: currentData.bands.top, color: getBandColor('top') },
        { name: 'Upper Band', value: currentData.bands.upper, color: getBandColor('upper') },
        { name: 'Middle Band', value: currentData.bands.middle, color: getBandColor('middle') },
        { name: 'Lower Band', value: currentData.bands.lower, color: getBandColor('lower') },
        { name: 'Bottom Band', value: currentData.bands.bottom, color: getBandColor('bottom') }
    ];

    const content = bands.map(band => 
        `<div style="color: ${band.color}; margin: 2px 0;">
            ${band.name}: ${formatPrice(band.value)}
        </div>`
    ).join('');

    bandPricesDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Current Deviation Bands:</div>
        ${content}
    `;
}

async function plotPowerLawChart() {
  const csvData = await fetchCSVData();
  const mempoolData = await fetchMempoolData();
  const historicalPrices = [...csvData, ...mempoolData].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  const weeklyPrices = aggregateByWeek(historicalPrices);
  const powerLawData = calculatePowerLawWithBands(weeklyPrices);

  updateBandPrices(powerLawData);

  const labels = powerLawData.map(d => d.date);
  const bands = powerLawData.map(d => d.bands);

  const ctx = document.getElementById('btcPowerLawChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Top Band',
          data: bands.map(b => b.top),
          borderColor: 'rgb(255 118 118)',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Upper Band',
          data: bands.map(b => b.upper),
          borderColor: 'rgb(243 186 129)',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Middle Band',
          data: bands.map(b => b.middle),
          borderColor: 'rgb(72 217 150)',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Lower Band',
          data: bands.map(b => b.lower),
          borderColor: 'rgb(126 188 230)',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Bottom Band',
          data: bands.map(b => b.bottom),
          borderColor: 'rgb(138 128 245)',
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Bitcoin Price',
          data: powerLawData.map(d => d.price),
          borderColor: 'rgba(255, 165, 0, 1)',
          borderWidth: 3,
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: false
      },
      maintainAspectRatio: true,
      layout: {
        padding: { left: 10, right: 10, top: 10, bottom: 10 }
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: { unit: 'year', min: '2010-01-01' },
          ticks: {
            fontColor: "rgba(255, 255, 255, 0.7)",
            padding: 10,
            autoSkipPadding: 5
          },
          gridLines: {
            color: "rgba(255, 255, 255, 0.03)",
            drawTicks: false,
            drawBorder: true,
            zeroLineColor: "rgba(255, 255, 255, 0.03)",
            zeroLineWidth: 1
          }
        }],
        yAxes: [{
          type: 'logarithmic',
          ticks: {
            fontColor: "rgba(255, 255, 255, 0.7)",
            padding: 10,
            callback: function (value) {
              const tickValues = [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000, 5000000, 20000000];
              return tickValues.includes(value) ? formatPrice(value) : null;
            }
          },
          gridLines: {
            color: "rgba(255, 255, 255, 0.03)",
            drawTicks: false,
            drawBorder: true,
            zeroLineColor: "rgba(255, 255, 255, 0.03)",
            zeroLineWidth: 1
          }
        }]
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem) {
            return formatPrice(tooltipItem.yLabel);
          }
        }
      },
      legend: { display: false }
    }
  });
}

async function scheduleBandPriceUpdatesWithDailyClose() {
    async function updatePrices() {
        const mempoolData = await fetchMempoolData();
        const csvData = await fetchCSVData();
        const historicalPrices = [...csvData, ...mempoolData].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );
        const weeklyPrices = aggregateByWeek(historicalPrices);
        const powerLawData = calculatePowerLawWithBands(weeklyPrices);
        updateBandPrices(powerLawData);
    }

    const now = new Date();
    const nextClose = new Date(now);
    nextClose.setUTCHours(0, 0, 0, 0);
    if (now >= nextClose) nextClose.setUTCDate(nextClose.getUTCDate() + 1);
    const timeUntilNextClose = nextClose.getTime() - now.getTime();

    setTimeout(() => {
        updatePrices();
        setInterval(updatePrices, 24 * 60 * 60 * 1000);
    }, timeUntilNextClose);
}

document.addEventListener('DOMContentLoaded', () => {
    plotPowerLawChart();
    scheduleBandPriceUpdatesWithDailyClose();
});
