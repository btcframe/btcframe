let isMayerMultipleChartRendered = false;
let mayerChartInstance = null;

async function fetchAndRenderMayerMultipleChart() {
  const apiUrl = "https://min-api.cryptocompare.com/data/v2/histoday";
  const limit = 1825;
  const smaLength = 200;
  const cacheKey = "mayerMultipleData";
  const cacheExpiryKey = "mayerMultipleExpiry";
  const cacheDuration = 20 * 60 * 1000;

  try {
    const cachedData = localStorage.getItem(cacheKey);
    const cacheExpiry = localStorage.getItem(cacheExpiryKey);

    if (cachedData && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
      const prices = JSON.parse(cachedData);
      renderChart(prices, smaLength);
      return;
    }

    const response = await fetch(`${apiUrl}?fsym=BTC&tsym=USD&limit=${limit}`);
    const data = await response.json();
    if (data.Response !== "Success") return;

    const prices = data.Data.Data.map(day => ({
      date: new Date(day.time * 1000).toISOString().split('T')[0],
      timestamp: day.time * 1000,
      price: day.close,
    }));

    const validPrices = prices.filter(p => p.price > 0);

    localStorage.setItem(cacheKey, JSON.stringify(validPrices));
    localStorage.setItem(cacheExpiryKey, (Date.now() + cacheDuration).toString());

    renderChart(validPrices, smaLength);
  } catch (error) {
    console.error("Error fetching Mayer Multiple data:", error);
  }
}

function renderChart(prices, smaLength) {
  const canvas = document.getElementById("mayerMultipleChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (mayerChartInstance) return;

  const chartData = [];
  const priceData = [];
  const barColors = [];

  for (let i = smaLength - 1; i < prices.length; i++) {
    const sma = prices.slice(i - smaLength + 1, i + 1).reduce((sum, p) => sum + p.price, 0) / smaLength;
    if (!isFinite(sma) || sma === 0) continue;

    const mayerMultiple = prices[i].price / sma;
    if (!isFinite(mayerMultiple) || mayerMultiple <= 0) continue;

    chartData.push({ x: prices[i].date, y: mayerMultiple });
    priceData.push({ x: prices[i].date, y: prices[i].price });

    if (mayerMultiple > 3.0) barColors.push("rgba(255, 0, 0, 0.8)");
    else if (mayerMultiple > 2.6) barColors.push("rgba(255, 128, 0, 0.8)");
    else if (mayerMultiple > 2.2) barColors.push("rgba(255, 204, 0, 0.8)");
    else if (mayerMultiple > 1.9) barColors.push("rgba(255, 255, 0, 0.8)");
    else if (mayerMultiple > 1.45) barColors.push("rgba(128, 255, 0, 0.8)");
    else if (mayerMultiple > 1.2) barColors.push("rgba(0, 255, 0, 0.8)");
    else if (mayerMultiple > 1.0) barColors.push("rgba(0, 255, 128, 0.8)");
    else if (mayerMultiple > 0.85) barColors.push("rgba(0, 255, 255, 0.8)");
    else if (mayerMultiple > 0.7) barColors.push("rgba(0, 128, 255, 0.8)");
    else if (mayerMultiple > 0.55) barColors.push("rgba(148, 78, 208, 0.8)");
    else barColors.push("rgba(255, 255, 255, 0.8)");
  }

  let latestMayer, dailyChange, dotColor;
  if (chartData.length > 1) {
    latestMayer = chartData[chartData.length - 1].y;
    const previousMayer = chartData[chartData.length - 2].y;
    dailyChange = ((latestMayer - previousMayer) / previousMayer) * 100;

    const displayValue = latestMayer.toFixed(2);
    document.getElementById("mayer-current-price").textContent = "Mayer Multiple: " + displayValue;

    const arrow = dailyChange > 0 ? "▲" : dailyChange < 0 ? "▼" : "■";
    dotColor = dailyChange > 0 ? "green" : dailyChange < 0 ? "red" : "gray";

    const priceChangeEl = document.getElementById("mayer-price-change");
    priceChangeEl.textContent = dailyChange.toFixed(2) + "% " + arrow;
    priceChangeEl.style.color = dotColor;

    const dotEl = document.getElementById("price-dot-mayer");
    dotEl.style.setProperty("background-color", dotColor, "important");
  } else {
    latestMayer = 2.1;
    dotColor = "gray";
  }

  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = 400;

  mayerChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      datasets: [
        {
          label: "Mayer Multiple",
          data: chartData,
          backgroundColor: barColors,
          yAxisID: "y-axis-mayer"
        },
        {
          label: "Bitcoin Price (Logarithmic)",
          data: priceData,
          type: "line",
          borderColor: "rgba(255, 255, 255, 1)",
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          yAxisID: "y-axis-price"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 1
        }
      },
      scales: {
        xAxes: [{
          type: "time",
          time: {
            parser: "YYYY-MM-DD",
            unit: "month",
            tooltipFormat: "YYYY-MM-DD"
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 20,
            minRotation: 45,
            padding: 10
          },
          gridLines: {
            display: true,
            color: 'rgba(255, 255, 255, 0.03)',  // subtle transparency
            drawTicks: false,
            drawBorder: true,
            lineWidth: 1,
            zeroLineWidth: 0,
            offsetGridLines: false,
            drawOnChartArea: true
          }
        }],
        yAxes: [
          {
            id: "y-axis-mayer",
            position: "left",
            scaleLabel: { display: true, labelString: "Mayer Multiple" },
            ticks: {
              beginAtZero: true,
              max: Math.ceil(Math.max(...chartData.map(d => d.y)) * 1.05) + 0.001,
              stepSize: 0.5,
              callback: value => value.toFixed(2),
              padding: 10
            },
            gridLines: {
              display: true,
              color: 'rgba(255, 255, 255, 0.03)',  // subtle transparency
              drawTicks: false,
              drawBorder: true,
              lineWidth: 1,
              zeroLineWidth: 0,
              offsetGridLines: false,
              drawOnChartArea: true
            }
          },
          {
            id: "y-axis-price",
            position: "right",
            type: "logarithmic",
            scaleLabel: { display: true, labelString: "Bitcoin Price (USD)" },
            ticks: {
              callback: function(value) {
                const logValues = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
                if (logValues.includes(value)) {
                  return `$${(value / 1000).toFixed(0)}k`;
                }
                return null;
              },
              padding: 10
            },
            gridLines: {
              display: false,
              color: "rgba(255, 255, 255, 0.03)"
            }
          }
        ]
      },
      legend: { display: false },
      plugins: {
        datalabels: false
      },
      tooltips: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (tooltipItem, data) => {
            const datasetLabel = data.datasets[tooltipItem.datasetIndex].label || "";
            const value = tooltipItem.yLabel.toLocaleString();
            return `${datasetLabel}: ${value}`;
          }
        }
      },
      annotation: {
        annotations: [
          {
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-mayer",
            value: latestMayer,
            borderColor: dotColor,
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              enabled: true,
              content: latestMayer.toFixed(2),
              position: "left",
              backgroundColor: dotColor,
              fontSize: 16
            }
          }
        ]
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  if (hash === "#page16" && !isMayerMultipleChartRendered) {
    fetchAndRenderMayerMultipleChart();
    isMayerMultipleChartRendered = true;
  }
  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#page16" && !isMayerMultipleChartRendered) {
      fetchAndRenderMayerMultipleChart();
      isMayerMultipleChartRendered = true;
    } else if (window.location.hash !== "#page16") {
      isMayerMultipleChartRendered = false;
    }
  });
});
