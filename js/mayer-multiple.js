async function fetchAndRenderMayerMultipleChart() {
  console.log("Starting to fetch and render the Mayer Multiple Chart");

  const apiUrl = "https://min-api.cryptocompare.com/data/v2/histoday";
  const limit = 1825; // Fetch 5 years (approximately 1825 days)
  const smaLength = 200; // 200-day SMA
  const cacheKey = "mayerMultipleData";
  const cacheExpiryKey = "mayerMultipleExpiry";
  const cacheDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

  try {
    // Check for cached data
    const cachedData = localStorage.getItem(cacheKey);
    const cacheExpiry = localStorage.getItem(cacheExpiryKey);

    if (cachedData && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
      console.log("Using cached data for Mayer Multiple Chart");
      const prices = JSON.parse(cachedData);
      renderChart(prices, smaLength);
      return;
    }

    // Fetch new data if no valid cache is found
    const response = await fetch(`${apiUrl}?fsym=BTC&tsym=USD&limit=${limit}`);
    const data = await response.json();

    if (data.Response !== "Success") {
      console.error("Error fetching data from CryptoCompare:", data.Message);
      return;
    }

    const prices = data.Data.Data.map((day) => ({
      date: new Date(day.time * 1000).toLocaleString("en-US", { timeZone: "America/New_York" }),
      timestamp: day.time * 1000,
      price: day.close,
    }));

    console.log("Total historical prices fetched:", prices);

    // Filter out any invalid prices (e.g., price = 0)
    const validPrices = prices.filter((p) => p.price > 0);

    // Cache the data
    localStorage.setItem(cacheKey, JSON.stringify(validPrices));
    localStorage.setItem(cacheExpiryKey, (Date.now() + cacheDuration).toString());

    renderChart(validPrices, smaLength);
  } catch (error) {
    console.error("Error fetching Mayer Multiple data:", error);
  }
}

function renderChart(prices, smaLength) {
  const canvas = document.getElementById("mayerMultipleChart");
  if (!canvas) {
    console.error("Canvas element for Mayer Multiple Chart not found.");
    return;
  }

  const ctx = canvas.getContext("2d");

  console.log("Total prices available for charting:", prices.length);

  const chartData = [];
  const priceData = [];
  const barColors = [];

  for (let i = smaLength - 1; i < prices.length; i++) {
    const sma = prices
      .slice(i - smaLength + 1, i + 1)
      .reduce((sum, p) => sum + p.price, 0) / smaLength;

    if (!isFinite(sma) || sma === 0) {
      continue; // Skip invalid SMA values
    }

    const mayerMultiple = prices[i].price / sma;

    if (isFinite(mayerMultiple) && mayerMultiple > 0) {
      chartData.push({
        x: prices[i].date,
        y: mayerMultiple,
      });

      priceData.push({
        x: prices[i].date,
        y: prices[i].price,
      });

      // Determine bar color based on Mayer Multiple
      if (mayerMultiple > 3.0) barColors.push("rgba(255, 0, 0, 0.8)"); // Red
      else if (mayerMultiple > 2.6) barColors.push("rgba(255, 128, 0, 0.8)"); // Orange
      else if (mayerMultiple > 2.2) barColors.push("rgba(255, 204, 0, 0.8)"); // Amber
      else if (mayerMultiple > 1.9) barColors.push("rgba(255, 255, 0, 0.8)"); // Yellow
      else if (mayerMultiple > 1.45) barColors.push("rgba(128, 255, 0, 0.8)"); // Chartreuse
      else if (mayerMultiple > 1.2) barColors.push("rgba(0, 255, 0, 0.8)"); // Lime
      else if (mayerMultiple > 1.0) barColors.push("rgba(0, 255, 128, 0.8)"); // Mint
      else if (mayerMultiple > 0.85) barColors.push("rgba(0, 255, 255, 0.8)"); // Aqua
      else if (mayerMultiple > 0.7) barColors.push("rgba(0, 128, 255, 0.8)"); // Azure
      else if (mayerMultiple > 0.55) barColors.push("rgba(148, 78, 208, 0.8)"); // Violet
      else barColors.push("rgba(255, 255, 255, 0.8)"); // White
    }
  }

  console.log("Filtered Chart Data:", chartData);

  if (chartData.length === 0) {
    console.error("No valid data to render the chart.");
    return;
  }

  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = 400;

  // Render the chart
  new Chart(ctx, {
    type: "bar",
    data: {
      datasets: [
        {
          label: "Mayer Multiple",
          data: chartData,
          backgroundColor: barColors,
          yAxisID: "y-axis-mayer",
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
          yAxisID: "y-axis-price",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [
          {
            type: "time",
            time: {
              unit: "month",
              tooltipFormat: "MMM D, YYYY",
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 20,
              minRotation: 45,
            },
          },
        ],
        yAxes: [
          {
            id: "y-axis-mayer",
            position: "left",
            scaleLabel: {
              display: true,
              labelString: "Mayer Multiple",
            },
            ticks: {
              callback: (value) => value.toFixed(2),
            },
          },
          {
            id: "y-axis-price",
            position: "right",
            type: "logarithmic",
            scaleLabel: {
              display: true,
              labelString: "Bitcoin Price (USD)",
            },
            ticks: {
              callback: (value) => {
                const logValues = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
                if (logValues.includes(value)) {
                  return `$${(value / 1000).toFixed(0)}k`;
                }
                return null;
              },
            },
            gridLines: {
              drawOnChartArea: false,
            },
          },
        ],
      },
      legend: {
        display: false,
      },
      tooltips: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (tooltipItem, data) => {
            const datasetLabel = data.datasets[tooltipItem.datasetIndex].label || "";
            const value = tooltipItem.yLabel.toLocaleString();
            return `${datasetLabel}: ${value}`;
          },
        },
      },
    },
  });
}

// Initialize chart when Page 16 is active
document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  console.log("Page loaded, current hash:", hash);
  if (hash === "#page16") {
    fetchAndRenderMayerMultipleChart();
  }

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#page16") {
      fetchAndRenderMayerMultipleChart();
    }
  });
});
