let goldBtcChart;
let btcPerKgPrices = [];
let btcPerOzPrices = [];
let timestamps = [];
let previousBtcPerOz24h = null; // Store the BTC price per Oz from 24 hours ago

// Function to fetch current BTC prices for Tether Gold (both per Kg and per Oz)
async function fetchGoldPricesInBTC() {
  try {
    console.log('Fetching current prices and historical 24h data...');

    // Fetch both current and 24h historical data simultaneously
    const [currentResponse, historicalData] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=btc'),
      fetchGoldPriceHistory24h()
    ]);

    if (!currentResponse.ok) {
      throw new Error(`Failed to fetch current prices. Status: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();
    const btcPerKg = currentData['tether-gold'].btc * 32.1507; // 1 Kg = 32.1507 oz
    const btcPerOz = currentData['tether-gold'].btc;

    console.log('Current BTC per Kg:', btcPerKg);
    console.log('Current BTC per Oz:', btcPerOz);

    // Use the fetched historical data
    if (historicalData && historicalData.btcPerOz24h) {
      previousBtcPerOz24h = historicalData.btcPerOz24h;
      console.log('BTC per Oz 24h ago:', previousBtcPerOz24h);
    } else {
      console.error('Failed to fetch 24h historical price');
      previousBtcPerOz24h = btcPerOz; // Fallback to current price if no historical data is available
    }

    // Calculate percentage change for Oz based on 24-hour price
    let percentageChangeOz = 0;
    let arrowOz = ""; // Default no arrow
    let color = "gray"; // Default gray for 0% change

    if (previousBtcPerOz24h !== null) {
      percentageChangeOz = ((btcPerOz - previousBtcPerOz24h) / previousBtcPerOz24h) * 100;
      if (percentageChangeOz > 0) {
        arrowOz = "▲";
        color = "green";
      } else if (percentageChangeOz < 0) {
        arrowOz = "▼";
        color = "red";
      } else {
        arrowOz = "■"; // Gray square for 0% change
      }
    }

    console.log('Percentage change for BTC per Oz:', percentageChangeOz);

    // Update the text in the price-container with the current prices
    document.getElementById('gold-btc-price-per-kg').innerHTML = `${btcPerKg.toFixed(8)} BTC per Kg <span style="color:${color}">${percentageChangeOz.toFixed(2)}% ${arrowOz}</span>`;

  } catch (error) {
    console.error('Error fetching current gold prices:', error);
    document.getElementById('gold-btc-price-per-kg').innerText = "Error";
  }
}

// Function to fetch 24 hours of historical BTC prices for Tether Gold
async function fetchGoldPriceHistory24h() {
  try {
    console.log('Fetching 24h historical prices...');
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=btc&days=1'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch 24h historical prices. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.prices || !data.prices.length) {
      throw new Error("No historical data found");
    }

    // Get the BTC price per ounce from 24 hours ago
    const btcPerOz24h = data.prices[0][1]; // First entry should be 24 hours ago
    return { btcPerOz24h };
  } catch (error) {
    console.error('Error fetching 24h historical gold prices:', error);
    return { btcPerOz24h: null };  // Return null if fetching fails to prevent crash
  }
}

// Function to fetch one year of historical BTC prices for Tether Gold
async function fetchGoldPriceHistory() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=btc&days=365'
    );
    if (!response.ok) throw new Error(`Failed to fetch 1-year historical prices. Status: ${response.status}`);
    const data = await response.json();
    
    // CoinGecko returns prices in the form of [timestamp, price] for each data point
    const btcPerOzHistory = data.prices.map((entry) => ({
      time: new Date(entry[0]),   // The timestamp
      price: entry[1]             // BTC price per ounce
    }));

    // Calculate BTC price per kilogram (since 1 Kg = 32.1507 ounces)
    const btcPerKgHistory = btcPerOzHistory.map((entry) => ({
      time: entry.time,
      price: entry.price * 32.1507 // Convert ounces to kilograms
    }));

    return { btcPerKgHistory, btcPerOzHistory };
  } catch (error) {
    console.error('Error fetching historical gold prices:', error);
  }
}

// Function to create the chart (only called once)
function createGoldBtcChart() {
  const ctx = document.getElementById('goldBtcChart').getContext('2d');
  
  goldBtcChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,  // X-axis (timestamps)
      datasets: [
        {
          label: 'BTC per Kg',
          data: btcPerKgPrices,
          borderColor: 'rgba(255, 215, 0, 1)', // Gold color
          yAxisID: 'left-y-axis',
          fill: false,
          pointRadius: 0,  // Remove dots
        },
        {
          label: 'BTC per Oz',
          data: btcPerOzPrices,
          borderColor: 'rgba(255, 215, 0, 1)', // Gold color
          yAxisID: 'right-y-axis',
          fill: false,
          pointRadius: 0,  // Remove dots
        }
      ],
    },
    options: {
      legend: {
        display: false, // Remove legends
      },
      tooltips: {
        enabled: false, // Remove tooltips
      },
      scales: {
        yAxes: [
          {
            id: 'left-y-axis',
            type: 'linear',
            position: 'left',
            ticks: {
              beginAtZero: false,
              callback: function(value) {
                return value.toFixed(8) + ' BTC';
              },
            },
            scaleLabel: {
              display: true,
              labelString: 'BTC per Kg',
            },
          },
          {
            id: 'right-y-axis',
            type: 'linear',
            position: 'right',
            ticks: {
              beginAtZero: false,
              callback: function(value) {
                return value.toFixed(8) + ' BTC';
              },
            },
            scaleLabel: {
              display: true,
              labelString: 'BTC per Oz',
            },
          },
        ],
        xAxes: [
          {
            type: 'time',
            time: {
              unit: 'month',  // Time unit for 1-year data
              tooltipFormat: 'll',  // Format for tooltips
            },
            scaleLabel: {
              display: false, // Remove the 'Time' label from X-axis
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 12, // Adjust as needed
            },
          },
        ],
      },
    },
  });
}

// Function to update the chart with historical data
async function updateGoldBtcChart() {
  const { btcPerKgHistory } = await fetchGoldPriceHistory();

  // Update the chart data
  btcPerKgPrices = btcPerKgHistory.map((entry) => entry.price); // BTC per Kg
  btcPerOzPrices = btcPerKgPrices.map((price) => price / 32.1507); // BTC per Oz
  timestamps = btcPerKgHistory.map((entry) => entry.time);      // Extract the timestamps

  // Update the chart data
  goldBtcChart.data.labels = timestamps;
  goldBtcChart.data.datasets[0].data = btcPerKgPrices;  // Update Kg dataset
  goldBtcChart.data.datasets[1].data = btcPerOzPrices;  // Update Oz dataset

  // Update the chart
  goldBtcChart.update();
}

// Initialize the chart and fetch data when the page loads
window.addEventListener('load', () => {
  createGoldBtcChart();
  updateGoldBtcChart();  // Fetch and display 1 year of historical data

  // Fetch current prices and update the price-container
  fetchGoldPricesInBTC();  // Ensure we fetch the current prices right after the page loads

  // Optionally refresh the current price every minute
  setInterval(fetchGoldPricesInBTC, 60000);  // Update current price every 60 seconds
});
