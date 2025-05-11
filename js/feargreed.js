let chart; // Declare a global variable to store the chart instance

// Function to fetch Fear & Greed data from the API
async function fetchFearGreedData() {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=10');
    const data = await response.json();
    const fearGreedData = data.data;

    // Parse values to integers
    const currentValue = parseInt(fearGreedData[0].value); // Today's value
    const yesterdayValue = parseInt(fearGreedData[1].value); // Yesterday's value
    const sevenDaysValue = parseInt(fearGreedData[6].value); // 7 Days Ago value
    const thirtyDaysValue = parseInt(fearGreedData[9].value); // 30 Days Ago value

    // Update the Highcharts gauge with the actual value
    updateFearGreedGauge(currentValue);

    // Update historical values for yesterday, 7 days ago, and 30 days ago
    updateHistoricalData(yesterdayValue, sevenDaysValue, thirtyDaysValue);

    // Update the title in price-container with current value and circular background
    updateTitleWithCurrentValue(currentValue);

    // Calculate the percentage change compared to yesterday
    if (yesterdayValue !== 0) { // To avoid division by zero
      const percentChange = ((currentValue - yesterdayValue) / yesterdayValue) * 100;
      const percentChangeColor = percentChange > 0 ? "green" : percentChange < 0 ? "red" : "gray";
      const percentChangeSign = percentChange > 0 ? "+" : "";
      const arrowDirection = percentChange > 0 ? "▲" : percentChange < 0 ? "▼" : "■";

      // Display the percentage change as a div with the requested structure in Page 10
      document.querySelector('#page10 .price-container').innerHTML += 
        `<div class="price-change" id="hashrate-change">
           <font color="${percentChangeColor}">${percentChangeSign}${percentChange.toFixed(2)}% <span class="arrow">${arrowDirection}</span></font>
         </div>`;
    } else {
      console.error("Yesterday's value is zero, cannot calculate percentage change.");
    }
  } catch (error) {
    console.error("Failed to fetch Fear & Greed Index data:", error);
  }
}

// Function to update the title in the price-container with the current Fear & Greed value
function updateTitleWithCurrentValue(value) {
  const priceContainer = document.querySelector('#page10 .price-container');
  
  // Remove any existing value span
  const existingValue = priceContainer.querySelector('.value-wrapper');
  if (existingValue) {
    existingValue.remove();
  }

  // Create a new span for the value with circular background
  const valueWrapper = document.createElement('span');
  valueWrapper.classList.add('value-wrapper');

  // Add background color based on value
  if (value >= 80) {
    valueWrapper.classList.add('dark-green');
  } else if (value >= 60) {
    valueWrapper.classList.add('green');
  } else if (value >= 40) {
    valueWrapper.classList.add('yellow');
  } else if (value >= 20) {
    valueWrapper.classList.add('red');
  } else {
    valueWrapper.classList.add('dark-red');
  }

  valueWrapper.innerHTML = `<span class="value">${value}</span>`;

  // Append the circular value span to the title
  priceContainer.innerHTML = `Fear & Greed: `;
  priceContainer.appendChild(valueWrapper);
}

// Add this at the beginning of your updateFearGreedGauge function in feargreed.js
function updateFearGreedGauge(value) {
  // Check if it's a 2K monitor
  const is2KMonitor = window.innerWidth >= 2000 && window.innerWidth <= 2600;
  
  const chartOptions = {
    chart: {
      type: 'gauge',
      plotBackgroundColor: null,
      plotBorderWidth: 0,
      plotShadow: false,
      backgroundColor: 'transparent',
      spacing: [0, 0, 0, 0]
    },

    title: {
      text: null
    },

    pane: {
      startAngle: -90,
      endAngle: 90,
      background: null,
      center: ['50%', '80%'],
      size: is2KMonitor ? '120%' : '100%' // Larger for 2K monitors
    },

    exporting: {
      enabled: false
    },

    credits: {
      enabled: false
    },

    tooltip: {
      enabled: false
    },

    yAxis: {
      min: 0,
      max: 100,
      tickPixelInterval: is2KMonitor ? 90 : 72, // Adjust for 2K
      tickPosition: 'inside',
      tickLength: is2KMonitor ? 50 : 40, // Longer ticks for 2K
      tickColor: '#202023',
      tickWidth: is2KMonitor ? 3 : 2, // Thicker ticks for 2K
      minorTickInterval: null,
      labels: {
        distance: is2KMonitor ? 50 : 40,
        style: {
          fontSize: is2KMonitor ? '26px' : '20px', // Larger font for 2K
          color: '#ffffff'
        }
      },
      lineWidth: 0,
      plotBands: [
        {
          from: 0,
          to: 20,
          color: '#8B0000',
          thickness: is2KMonitor ? 50 : 40
        },
        {
          from: 20,
          to: 40,
          color: '#e74c3c',
          thickness: is2KMonitor ? 50 : 40
        },
        {
          from: 40,
          to: 60,
          color: '#f1c40f',
          thickness: is2KMonitor ? 50 : 40
        },
        {
          from: 60,
          to: 80,
          color: '#27ae60',
          thickness: is2KMonitor ? 50 : 40
        },
        {
          from: 80,
          to: 100,
          color: '#006400',
          thickness: is2KMonitor ? 50 : 40
        }
      ]
    },

    series: [
      {
        name: 'Index',
        data: [value],
        dataLabels: {
          enabled: false,
        },
        dial: {
          radius: is2KMonitor ? '85%' : '80%',
          backgroundColor: 'gray',
          baseWidth: is2KMonitor ? 15 : 12,
          baseLength: '0%',
          rearLength: '0%'
        },
        pivot: {
          backgroundColor: 'gray',
          radius: is2KMonitor ? 8 : 6
        }
      }
    ]
  };

  if (!chart) {
    // Initialize the chart if it's not already initialized
    chart = Highcharts.chart('fearGreedGauge', chartOptions);
  } else {
    // Update the chart's data if it is already initialized
    chart.series[0].setData([value], true);
    
    // For 2K monitors, update chart settings on resize or page change
    if (is2KMonitor) {
      chart.update(chartOptions);
    }
  }
}

// Function to update the historical values and set the background colors
function updateHistoricalData(yesterday, sevenDaysAgo, thirtyDaysAgo) {
  setValueWithColor('yesterday-value', yesterday);
  setValueWithColor('seven-days-value', sevenDaysAgo);
  setValueWithColor('thirty-days-value', thirtyDaysAgo);
}

// Function to set the value and apply background color based on the classification
function setValueWithColor(elementId, value) {
  value = parseInt(value);

  if (isNaN(value)) {
    console.error(`Invalid value for ${elementId}:`, value);
    return;
  }

  const valueElement = document.getElementById(elementId);
  valueElement.innerText = value;

  const parentElement = valueElement.parentElement;
  parentElement.classList.remove('green', 'dark-green', 'yellow', 'red', 'dark-red');

  if (value >= 80) {
    parentElement.classList.add('dark-green');
  } else if (value >= 60) {
    parentElement.classList.add('green');
  } else if (value >= 40) {
    parentElement.classList.add('yellow');
  } else if (value >= 20) {
    parentElement.classList.add('red');
  } else {
    parentElement.classList.add('dark-red');
  }
}

// Automatically fetch and update data every 1 hour (3,600,000 milliseconds)
setInterval(fetchFearGreedData, 3600000);

document.addEventListener("DOMContentLoaded", function() {
  fetchFearGreedData();
});
