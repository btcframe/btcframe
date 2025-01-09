async function fetchBitcoinTxData() {
  try {
<<<<<<< HEAD
=======
    // Use the CORS proxy to make the API request
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
    const response = await fetch("https://tx-count.ngrok.app/bitcoin-transactions");

    if (!response.ok) {
      throw new Error("Failed to fetch data from the ngrok API");
    }

    const data = await response.json();

<<<<<<< HEAD
=======
    // Ensure data is valid
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
    if (!data || !data.values) {
      throw new Error("No transaction data available");
    }

    // Extract the labels (dates) and transaction counts
    let labels = data.values.map(item => {
      const date = new Date(item.x * 1000); // Convert Unix timestamp to Date object
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; // Format as YYYY-MM-DD
    });

<<<<<<< HEAD
    let txCounts = data.values.map(item => item.y);

    // Update the last date and transaction count if provided
    const latestPeriod = data.latestPeriod || null; 
    const lastValue = data.lastValue || null; 

    if (latestPeriod && lastValue) {
      const lastDate = new Date(latestPeriod);
      const formattedLastDate = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;

=======
    let txCounts = data.values.map(item => item.y); // Transaction counts

    // Update the last date and transaction count from the API's "Last Value" and "Latest Period"
    const latestPeriod = data.latestPeriod || null; // Assume API provides "latestPeriod" in "Jan 07 2025" format
    const lastValue = data.lastValue || null; // Assume API provides "lastValue"

    if (latestPeriod && lastValue) {
      // Convert the "Latest Period" to a standard date format
      const lastDate = new Date(latestPeriod);

      // Format it as YYYY-MM-DD for consistency
      const formattedLastDate = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;

      // Replace or append the last date and value in the dataset
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
      if (labels[labels.length - 1] !== formattedLastDate) {
        labels.push(formattedLastDate);
        txCounts.push(lastValue);
      } else {
        labels[labels.length - 1] = formattedLastDate;
        txCounts[txCounts.length - 1] = lastValue;
      }
    }

    // Calculate today's transaction count and daily change
    const todayTxCount = txCounts[txCounts.length - 1];
    const yesterdayTxCount = txCounts[txCounts.length - 2];
    const dailyChange = ((todayTxCount - yesterdayTxCount) / yesterdayTxCount) * 100;

<<<<<<< HEAD
    // Update UI with today's data
=======
    // Update price-container with today's data
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
    const txContainer = document.querySelector(".price-container");
    if (txContainer) {
      const dotColor = dailyChange > 0 ? "green" : dailyChange < 0 ? "red" : "gray";
      const arrow = dailyChange > 0 ? "▲" : dailyChange < 0 ? "▼" : "■";

      document.getElementById("tx-dot").style.backgroundColor = dotColor;
      const txChangeElement = document.getElementById("tx-change");
      txChangeElement.innerHTML = `${dailyChange.toFixed(2)}% ${arrow}`;
<<<<<<< HEAD
      txChangeElement.style.color = dotColor;
=======
      txChangeElement.style.color = dotColor; // Update text and arrow color
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963

      document.getElementById("current-tx-count").innerText = `${todayTxCount.toLocaleString()} TX`;
    }

    // Reduce the number of labels on the x-axis: Show one dot and date every 30 days
<<<<<<< HEAD
    const reducedDates = []; // <-- Keep full YYYY-MM-DD dates in this array
    const reducedTxCounts = [];
    const daysInterval = 30; 
=======
    const reducedLabels = [];
    const reducedTxCounts = [];
    const daysInterval = 30; // Interval in days
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963

    const firstDate = new Date(labels[0]);
    const lastDate = new Date(labels[labels.length - 1]);

    let nextDate = new Date(firstDate);

    while (nextDate <= lastDate) {
      const formattedDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
      const index = labels.indexOf(formattedDate);

      if (index !== -1) {
<<<<<<< HEAD
        reducedDates.push(labels[index]); // <-- Store the exact YYYY-MM-DD
=======
        reducedLabels.push(labels[index]);
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
        reducedTxCounts.push(txCounts[index]);
      }

      nextDate.setDate(nextDate.getDate() + daysInterval);
    }

    // Always include the last date
<<<<<<< HEAD
    if (reducedDates[reducedDates.length - 1] !== labels[labels.length - 1]) {
      reducedDates.push(labels[labels.length - 1]);
      reducedTxCounts.push(txCounts[txCounts.length - 1]);
    }

    // Format for the X-axis display only: "MMM YYYY"
    const xAxisLabels = reducedDates.map(fullDateString => {
      const date = new Date(fullDateString); 
      const month = date.toLocaleString("default", { month: "short" });
      return `${month} ${date.getFullYear()}`;
=======
    if (reducedLabels[reducedLabels.length - 1] !== labels[labels.length - 1]) {
      reducedLabels.push(labels[labels.length - 1]);
      reducedTxCounts.push(txCounts[txCounts.length - 1]);
    }

    // Format reduced labels to "MMM YYYY" style
    const formattedLabels = reducedLabels.map(label => {
      const date = new Date(label);
      const month = date.toLocaleString("default", { month: "short" }); // e.g., "Jan", "Feb"
      return `${month} ${date.getFullYear()}`; // e.g., "Jan 2023"
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
    });

    // Initialize the chart
    const ctx = document.getElementById("txChart").getContext("2d");

<<<<<<< HEAD
    new Chart(ctx, {
      type: "line",
      data: {
        labels: xAxisLabels, // Use short month-year for the X-axis
        datasets: [{
          label: "Confirmed Bitcoin Transactions Per Day",
          data: reducedTxCounts,
          borderColor: "rgba(255, 165, 0, 1)", 
          borderWidth: 2,
          pointRadius: 6,
          pointBackgroundColor: "rgba(255, 165, 0, 1)",
          pointHitRadius: 5,
          lineTension: 0.3,
          fill: true,
          backgroundColor: "rgba(128, 128, 128, 0.3)"
=======
    // Create the chart
    new Chart(ctx, {
      type: "line",
      data: {
        labels: formattedLabels, // Use the formatted labels here
        datasets: [{
          label: "Confirmed Bitcoin Transactions Per Day",
          data: reducedTxCounts,
          borderColor: "rgba(255, 165, 0, 1)", // Line color
          borderWidth: 2,
          pointRadius: 6, // Increase point radius for better visibility of dots
          pointBackgroundColor: "rgba(255, 165, 0, 1)", // Dot color
          pointHitRadius: 5,
          lineTension: 0.3, // Smoothing the line to make it look more fluid
          fill: true, // Fill the area under the line
          backgroundColor: "rgba(128, 128, 128, 0.3)" // Gray with 30% transparency
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
        }],
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: false,
              callback: function(value) {
<<<<<<< HEAD
                return value.toLocaleString();
=======
                return value.toLocaleString(); // Format y-axis values
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
              },
            },
            gridLines: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          }],
          xAxes: [{
            ticks: {
              autoSkip: true,
              maxRotation: 45,
              minRotation: 45,
            },
            gridLines: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          }],
        },
        tooltips: {
          callbacks: {
<<<<<<< HEAD
            // Override the title callback to show the full date (YYYY-MM-DD)
            title: function(tooltipItems) {
              const index = tooltipItems[0].index;
              return reducedDates[index]; // <-- Show the original date
            },
            // The label will remain the TX count
=======
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
            label: function(tooltipItem) {
              return tooltipItem.yLabel.toLocaleString() + " TX";
            },
          },
        },
        legend: {
          display: true,
        },
        plugins: {
<<<<<<< HEAD
=======
          // Add transaction count labels on top of each dot
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
          datalabels: {
            display: true,
            align: 'top',
            font: {
              size: 10,
              weight: 'bold',
            },
<<<<<<< HEAD
            color: 'rgba(255, 165, 0, 1)',
            formatter: function(value) {
              return value.toLocaleString();
=======
            color: 'rgba(255, 165, 0, 1)', // Set the color of the text to match the dots
            formatter: function(value) {
              return value.toLocaleString(); // Format number with commas
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
            }
          }
        }
      },
    });
  } catch (error) {
    console.error("Error fetching Bitcoin transaction data:", error);
  }
}

<<<<<<< HEAD
=======
// Call the function when the page is loaded
>>>>>>> 3fd609de7d09b2bfd610db57e588479d32a84963
document.addEventListener("DOMContentLoaded", fetchBitcoinTxData);
