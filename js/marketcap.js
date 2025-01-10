function aggregateMonthlyData(data) {
  const monthlyData = {};
  data.forEach(({ date, marketCap }) => {
    const yearMonth = date.slice(0, 7);
    if (!monthlyData[yearMonth]) {
      monthlyData[yearMonth] = [];
    }
    monthlyData[yearMonth].push(marketCap);
  });
  return Object.entries(monthlyData).map(([month, values]) => ({
    date: month,
    marketCap: values.reduce((a, b) => a + b, 0) / values.length
  }));
}

async function fetchHistoricalGoldMarketCap() {
  try {
    const goldResponse = await fetch(
      "https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=usd&days=365"
    );
    const goldData = await goldResponse.json();
    const goldSupplyInTonnes = 215000;
    const ouncesPerTonne = 32150.7;
    const totalGoldSupplyInOunces = goldSupplyInTonnes * ouncesPerTonne;
    const goldMarketCaps = goldData.prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString().split("T")[0],
      marketCap: (price * totalGoldSupplyInOunces) / 1e12
    }));
    return aggregateMonthlyData(goldMarketCaps);
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchHistoricalBitcoinMarketCap() {
  try {
    const btcResponse = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365"
    );
    const btcData = await btcResponse.json();
    const bitcoinMarketCaps = btcData.market_caps.map(([timestamp, marketCap]) => ({
      date: new Date(timestamp).toISOString().split("T")[0],
      marketCap: marketCap / 1e12
    }));
    return aggregateMonthlyData(bitcoinMarketCaps);
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function renderMarketCapChart() {
  const ctx = document.getElementById("marketCapChart").getContext("2d");
  const [bitcoinMarketCaps, goldMarketCaps] = await Promise.all([
    fetchHistoricalBitcoinMarketCap(),
    fetchHistoricalGoldMarketCap()
  ]);
  const allDates = [
    ...new Set([
      ...bitcoinMarketCaps.map(d => d.date),
      ...goldMarketCaps.map(d => d.date)
    ])
  ].sort();
  const btcValues = allDates.map(date => bitcoinMarketCaps.find(d => d.date === date)?.marketCap || 0);
  const goldValues = allDates.map(date => goldMarketCaps.find(d => d.date === date)?.marketCap || 0);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: allDates,
      datasets: [
        {
          label: "Bitcoin",
          data: btcValues,
          fill: true,
          backgroundColor: "rgba(255, 165, 0, 0.2)",
          borderColor: "rgba(255, 165, 0, 0.8)",
          lineTension: 0.4
        },
        {
          label: "Gold",
          data: goldValues,
          fill: true,
          backgroundColor: "rgba(224, 212, 182, 0.2)",
          borderColor: "rgba(194, 169, 108, 0.8)",
          lineTension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      tooltips: {
        callbacks: {
          label: function (tooltipItem, data) {
            const rawValue = tooltipItem.yLabel;
            return data.datasets[tooltipItem.datasetIndex].label + ": " + parseFloat(rawValue).toFixed(2) + "T";
          }
        }
      },
      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true
            }
          }
        ],
        yAxes: [
          {
            type: "linear",
            scaleLabel: {
              display: true,
              labelString: "Market Capitalization (in Trillions)"
            },
            ticks: {
              callback: function (value) {
                const num = Number(value);
                return num === 0 ? "0T" : num.toLocaleString() + "T";
              }
            }
          }
        ]
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", renderMarketCapChart);
