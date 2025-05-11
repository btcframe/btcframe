const S2F_MODEL_PARAMS = {
    halvingInterval: 210000,
    initialReward: 50,
    blocksPerDay: 144,
    power: 2.94,
    multiplier: 0.34
};

const MEMPOOL_API_S2F = 'https://mempool.btcframe.com/api/v1/historical-price?currency=USD';
const FALLBACK_API_S2F = 'https://mempool.space/api/v1/historical-price?currency=USD';
const REALTIME_API = 'https://mempool.btcframe.com/api/v1/prices';
const FALLBACK_REALTIME_API = 'https://mempool.space/api/v1/prices';

const S2F_CACHE_DURATION = 20 * 60 * 1000;

async function fetchWithFallbackPage20(primaryUrl, fallbackUrl) {
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

function getCache(key) {
    const cachedData = localStorage.getItem(key);
    if (!cachedData) return null;
    const { timestamp, data } = JSON.parse(cachedData);
    if (Date.now() - timestamp < S2F_CACHE_DURATION) {
        return data;
    }
    localStorage.removeItem(key);
    return null;
}

function setCache(key, data) {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}

async function fetchMempoolData() {
    const cacheKey = 'mempoolData';
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const data = await fetchWithFallbackPage20(MEMPOOL_API_S2F, FALLBACK_API_S2F);
    if (!data || !data.prices) return [];

    const processed = data.prices.map(entry => ({
        date: new Date(entry.time * 1000).toISOString().split('T')[0],
        price: entry.USD
    }));
    setCache(cacheKey, processed);
    return processed;
}

async function fetchRealTimePrice() {
    const cacheKey = 'realTimePrice';
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const data = await fetchWithFallbackPage20(REALTIME_API, FALLBACK_REALTIME_API);
    if (!data || !data.USD) return 0;

    setCache(cacheKey, data.USD);
    return data.USD;
}

function getBlockHeight(date) {
    const genesisDate = new Date('2009-01-03');
    const daysSinceGenesis = Math.floor((date - genesisDate) / (1000 * 60 * 60 * 24));
    return Math.floor(daysSinceGenesis * S2F_MODEL_PARAMS.blocksPerDay);
}

function calculateCurrentBlockReward(blockHeight) {
    const halvings = Math.floor(blockHeight / S2F_MODEL_PARAMS.halvingInterval);
    return S2F_MODEL_PARAMS.initialReward / Math.pow(2, halvings);
}

function calculateCumulativeSupply(blockHeight) {
    const halvings = Math.floor(blockHeight / S2F_MODEL_PARAMS.halvingInterval);
    let supply = 0;

    for (let i = 0; i < halvings; i++) {
        supply += S2F_MODEL_PARAMS.halvingInterval * (S2F_MODEL_PARAMS.initialReward / Math.pow(2, i));
    }

    const remainingBlocks = blockHeight - (halvings * S2F_MODEL_PARAMS.halvingInterval);
    supply += remainingBlocks * (S2F_MODEL_PARAMS.initialReward / Math.pow(2, halvings));

    return supply;
}

function calculateMonthsUntilHalving(date) {
    const halvingDates = [
        new Date('2012-11-28'),
        new Date('2016-07-09'),
        new Date('2020-05-11'),
        new Date('2024-04-19'),
        new Date('2028-06-15')
    ];

    const nextHalving = halvingDates.find(halvingDate => date < halvingDate);
    
    if (!nextHalving) {
        const lastHalving = halvingDates[halvingDates.length - 1];
        const msPerHalvingCycle = 4 * 365.25 * 24 * 60 * 60 * 1000;
        const nextApproxHalving = new Date(lastHalving.getTime() + msPerHalvingCycle);
        const monthsUntil = (nextApproxHalving - date) / (30.44 * 24 * 60 * 60 * 1000);
        return monthsUntil;
    }

    const monthsUntil = (nextHalving - date) / (30.44 * 24 * 60 * 60 * 1000);
    return monthsUntil;
}

function splitPriceDataIntoColorSegments(s2fData) {
    const segments = [
        { maxMonths: 5, color: '#0047AB' },
        { maxMonths: 10, color: '#00A6ED' },
        { maxMonths: 15, color: '#00FF94' },
        { maxMonths: 20, color: '#4CBB17' },
        { maxMonths: 25, color: '#FFD700' },
        { maxMonths: 30, color: '#FFA500' },
        { maxMonths: 35, color: '#FF4500' },
        { maxMonths: 40, color: '#FF0000' },
        { maxMonths: 45, color: '#DC143C' },
        { maxMonths: 50, color: '#8B0000' }
    ];

    return segments.map(segment => {
        const segmentData = s2fData.map(d => {
            const monthsUntilHalving = calculateMonthsUntilHalving(new Date(d.date));
            const prevMaxMonths = segments.indexOf(segment) > 0 ? segments[segments.indexOf(segment) - 1].maxMonths : 0;
            if (prevMaxMonths < monthsUntilHalving && monthsUntilHalving <= segment.maxMonths) {
                return d.price;
            }
            return null;
        });

        return {
            label: 'Bitcoin Price',
            data: segmentData,
            borderColor: segment.color,
            borderWidth: 6,
            fill: false,
            pointRadius: 0
        };
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

function aggregateByWeek(data) {
    const weeklyData = [];
    let currentWeek = null;
    let lastPoint = null;

    data.forEach((entry) => {
        const date = new Date(entry.date);
        const week = date.getFullYear() + '-' + Math.ceil(date.getDate() / 7);

        if (week !== currentWeek) {
            if (lastPoint) weeklyData.push(lastPoint);
            currentWeek = week;
        }
        lastPoint = entry;
    });

    if (lastPoint) weeklyData.push(lastPoint);
    return weeklyData;
}

function calculateStockToFlowForBitcoin(weeklyPrices, realTimePrice) {
    const blocksPerYear = S2F_MODEL_PARAMS.blocksPerDay * 365.25;
    const currentDate = new Date();
    
    return weeklyPrices.map(entry => {
        const entryDate = new Date(entry.date);
        const blockHeight = getBlockHeight(entryDate);
        
        const totalSupply = calculateCumulativeSupply(blockHeight);
        const currentReward = calculateCurrentBlockReward(blockHeight);
        
        const annualFlow = currentReward * blocksPerYear;
        const s2fRatio = totalSupply / annualFlow;
        const s2fPrice = Math.pow(s2fRatio, S2F_MODEL_PARAMS.power) * S2F_MODEL_PARAMS.multiplier;

        let price = null;
        if (entryDate <= currentDate) {
            price = entry.price;
        }

        return {
            date: entry.date,
            price,
            s2fPrice,
            s2fRatio,
            blockHeight
        };
    });
}

function shiftPriceDataOneYear(s2fData) {
    return s2fData.map(dataPoint => {
        const currentDate = new Date(dataPoint.date);
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        return {
            ...dataPoint,
            date: currentDate.toISOString().split('T')[0]
        };
    });
}

function updateS2FMetrics(s2fData, realTimePrice) {
    const s2fMetricsDiv = document.getElementById("s2fMetrics");
    if (!s2fMetricsDiv) return;

    const currentDate = new Date();
    const blockHeight = getBlockHeight(currentDate);
    const totalSupply = calculateCumulativeSupply(blockHeight);
    const currentReward = calculateCurrentBlockReward(blockHeight);
    const blocksPerYear = S2F_MODEL_PARAMS.blocksPerDay * 365.25;
    const annualFlow = currentReward * blocksPerYear;
    const s2fRatio = totalSupply / annualFlow;
    const s2fPrice = Math.pow(s2fRatio, S2F_MODEL_PARAMS.power) * S2F_MODEL_PARAMS.multiplier;

    s2fMetricsDiv.innerHTML = `
        <div style="color: rgba(72, 217, 150, 1); margin: 3px 0;">
            S2F Model Price: ${formatPrice(s2fPrice)}
        </div>
        <div style="color: rgba(255, 165, 0, 1); margin: 3px 0;">
            Current Price: ${formatPrice(realTimePrice)}
        </div>
        <div style="color: rgba(255, 255, 255, 0.9); margin: 3px 0; font-size: 14px;">
            Model: S2F²·⁹⁴ × 0.34
        </div>
    `;
}

async function plotStockToFlowChart() {
  const [mempoolData, realTimePrice] = await Promise.all([
    fetchMempoolData(),
    fetchRealTimePrice()
  ]);

  const endDate = new Date('2029-01-05');
  const futureDates = [];
  const lastDate = new Date(Math.max(...mempoolData.map(d => new Date(d.date))));

  for (
    let currentDate = new Date(lastDate);
    currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    futureDates.push({
      date: currentDate.toISOString().split('T')[0],
      price: null
    });
  }

  const historicalPrices = [...mempoolData, ...futureDates].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const weeklyPrices = aggregateByWeek(historicalPrices);
  const s2fData = calculateStockToFlowForBitcoin(weeklyPrices, realTimePrice);

  updateS2FMetrics(s2fData, realTimePrice);

  const shiftedData = shiftPriceDataOneYear(s2fData);
  const ctx = document.getElementById('btcStockToFlowChart').getContext('2d');

  const chartOptions = {
    responsive: true,
    plugins: {
      datalabels: false
    },
    maintainAspectRatio: true,
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          unit: 'year',
          min: '2010-01-01',
          max: '2029-01-05',
          displayFormats: { year: 'YYYY' },
          distribution: 'linear',
          offset: true,
          bounds: 'ticks'
        },
        ticks: {
          source: 'auto',
          autoSkip: false,
          padding: 10,
          fontColor: 'rgba(255, 255, 255, 0.7)',
          min: '2010-01-01',
          max: '2029-01-05',
          callback: function (value) {
            const year = new Date(value).getFullYear();
            if (year >= 2010 && year <= 2028) {
              return year.toString();
            }
            return null;
          }
        },
        gridLines: {
          color: 'rgba(255, 255, 255, 0.03)',
          drawOnChartArea: true,
          drawTicks: false,
          drawBorder: true,
          zeroLineColor: 'rgba(255, 255, 255, 0.03)',
          zeroLineWidth: 1
        }
      }],
      yAxes: [{
        type: 'logarithmic',
        afterBuildTicks: function (chart) {
          chart.ticks = [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000, 5000000];
        },
        ticks: {
          callback: value => formatPrice(value),
          autoSkip: false,
          padding: 10,
          fontColor: 'rgba(255, 255, 255, 0.7)',
          max: 5000000
        },
        gridLines: {
          color: 'rgba(255, 255, 255, 0.03)',
          drawTicks: false,
          drawBorder: true,
          zeroLineColor: 'rgba(255, 255, 255, 0.03)',
          zeroLineWidth: 1
        }
      }]
    },
    tooltips: {
      callbacks: {
        title: function (tooltipItems) {
          const date = new Date(tooltipItems[0].xLabel);
          date.setFullYear(date.getFullYear() - 1);
          return date.toISOString().split('T')[0];
        },
        label: function (tooltipItem) {
          return formatPrice(tooltipItem.yLabel);
        }
      }
    },
    legend: {
      display: false
    }
  };

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: shiftedData.map(d => d.date),
      datasets: [
        {
          label: 'Stock-to-Flow Model Price',
          data: shiftedData.map(d => d.s2fPrice),
          borderColor: 'rgba(72, 217, 150, 1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0
        },
        ...splitPriceDataIntoColorSegments(shiftedData)
      ]
    },
    options: chartOptions
  });
}

function getTimeUntilNextDailyClose() {
    const now = new Date();
    const nextClose = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    return nextClose - now;
}

async function updateDailyS2FMetrics() {
    const [mempoolData, realTimePrice] = await Promise.all([
        fetchMempoolData(),
        fetchRealTimePrice()
    ]);

    const weeklyPrices = aggregateByWeek(mempoolData);
    const s2fData = calculateStockToFlowForBitcoin(weeklyPrices, realTimePrice);

    updateS2FMetrics(s2fData, realTimePrice);
}

// Schedule daily updates
function scheduleDailyUpdates() {
    const timeUntilClose = getTimeUntilNextDailyClose();

    setTimeout(() => {
        updateDailyS2FMetrics();

        setInterval(updateDailyS2FMetrics, 24 * 60 * 60 * 1000);
    }, timeUntilClose);
}

document.addEventListener('DOMContentLoaded', () => {
    plotStockToFlowChart();
    scheduleDailyUpdates();
});