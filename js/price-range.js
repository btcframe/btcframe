document.addEventListener("DOMContentLoaded", function () {
  drawPriceRangeChart();

  setInterval(() => {
    drawPriceRangeChart();
  }, 300000); // every 5 mins
});

async function drawPriceRangeChart() {
  const ranges = [
    [1000000, 10000000],
    [100000, 1000000],
    [10000, 100000],
    [1000, 10000],
    [100, 1000],
    [10, 100],
    [1, 10]
  ];

  const labels = ranges.map(([low, high]) => {
    const format = n => n >= 1000000 ? `$${n / 1000000}m` : n >= 1000 ? `$${n / 1000}k` : `$${n}`;
    return `${format(low)} - ${format(high)}`;
  });

  const daysInRange = new Array(ranges.length).fill(0);

  const csvData = await fetch("./bitcoin_dataset.csv").then(r => r.text());
  const rows = csvData.trim().split("\n").slice(1);
  rows.forEach(row => {
    const [date, priceStr] = row.split(",");
    const price = parseFloat(priceStr);
    if (isNaN(price)) return;
    for (let i = 0; i < ranges.length; i++) {
      const [low, high] = ranges[i];
      if (price >= low && price < high) {
        daysInRange[i]++;
        break;
      }
    }
  });

  const cacheKey = "price_range_data";
  let priceData;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      priceData = JSON.parse(cached);
    } else {
      const res = await fetch("https://mempool.btcframe.com/api/v1/historical-price?currency=USD");
      const data = await res.json();
      priceData = data.prices;
      localStorage.setItem(cacheKey, JSON.stringify(priceData));
    }
  } catch {
    priceData = [];
  }

  const jan1_2025 = new Date("2025-01-01").getTime() / 1000;
  const seenDays = new Set();

  priceData.forEach(p => {
    if (!p || typeof p.USD !== "number" || typeof p.time !== "number") return;
    if (p.time < jan1_2025) return;
    const dayKey = new Date(p.time * 1000).toISOString().slice(0, 10);
    if (seenDays.has(dayKey)) return;
    seenDays.add(dayKey);
    const price = p.USD;
    for (let i = 0; i < ranges.length; i++) {
      const [low, high] = ranges[i];
      if (price >= low && price < high) {
        daysInRange[i]++;
        break;
      }
    }
  });

  const ctx = document.getElementById("priceRangeChart").getContext("2d");

  new Chart(ctx, {
    type: "horizontalBar",
    data: {
      labels: labels,
      datasets: [{
        label: "Days in Price Range",
        data: daysInRange,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderColor: "#ffae42",
        borderWidth: 1,
        borderSkipped: []
      }]
    },
    options: {
      responsive: true,
      plugins: {
        datalabels: false
      },
      maintainAspectRatio: false,
      layout: {
        padding: { top: 5, bottom: 5, left: 5, right: 5 }
      },
      tooltips: { enabled: false },
      hover: {
        animationDuration: 0,
        mode: null,
        intersect: false
      },
      events: [],
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            fontColor: "rgba(255, 255, 255, 0.7)",
            fontSize: 12,
            padding: 10
          },
          gridLines: {
            color: "rgba(255, 255, 255, 0.03)",
            drawBorder: true,
            drawTicks: false,
            zeroLineColor: "rgba(255, 255, 255, 0.03)",
            zeroLineWidth: 1
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: "rgba(255, 255, 255, 0.7)",
            fontSize: 12,
            padding: 10
          },
          gridLines: {
            color: "rgba(255, 255, 255, 0.03)",
            drawBorder: true,
            drawTicks: false,
            zeroLineColor: "rgba(255, 255, 255, 0.03)",
            offsetGridLines: true
          }
        }]
      },
      legend: {
        display: false
      },
      title: { display: false },
      animation: {
        onComplete: function () {
          const chart = this.chart;
          const ctx = chart.ctx;
          ctx.font = "16px sans-serif";
          ctx.fillStyle = "#ffae42";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          chart.data.datasets[0].data.forEach((value, index) => {
            const model = chart.controller.getDatasetMeta(0).data[index]._model;
            const xPos = model.x + 10;
            const yPos = model.y;
            ctx.fillText(`${value} days`, xPos, yPos);
          });
        }
      }
    }
  });
}
