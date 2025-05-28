async function fetchBitcoinTxData() {
  try {
    const response = await fetch("https://tx.btcframe.com/bitcoin-transactions/");

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.values) {
      throw new Error("No transaction data available");
    }

    let labels = data.values.map(item => {
      const date = new Date(item.x * 1000);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });

    let txCounts = data.values.map(item => item.y);

    const latestPeriod = data.latestPeriod || null;
    const lastValue = data.lastValue || null;

    if (latestPeriod && lastValue) {
      const lastDate = new Date(latestPeriod);
      const formattedLastDate = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;

      if (labels[labels.length - 1] !== formattedLastDate) {
        labels.push(formattedLastDate);
        txCounts.push(lastValue);
      } else {
        labels[labels.length - 1] = formattedLastDate;
        txCounts[txCounts.length - 1] = lastValue;
      }
    }

    const todayTxCount = txCounts[txCounts.length - 1];
    const yesterdayTxCount = txCounts[txCounts.length - 2];
    const dailyChange = ((todayTxCount - yesterdayTxCount) / yesterdayTxCount) * 100;

    const txContainer = document.querySelector(".price-container");
    if (txContainer) {
      const dotColor = dailyChange > 0 ? "green" : dailyChange < 0 ? "red" : "gray";
      const arrow = dailyChange > 0 ? "▲" : dailyChange < 0 ? "▼" : "■";

      document.getElementById("tx-dot").style.backgroundColor = dotColor;
      const txChangeElement = document.getElementById("tx-change");
      txChangeElement.innerHTML = `${dailyChange.toFixed(2)}% ${arrow}`;
      txChangeElement.style.color = dotColor;

      document.getElementById("current-tx-count").innerText = `${todayTxCount.toLocaleString()} TXs`;
    }

    const xAxisLabels = labels.map(fullDateString => {
      const date = new Date(fullDateString);
      const month = date.toLocaleString("default", { month: "short" });
      const day = date.getDate();
      return `${month} ${day} ${date.getFullYear()}`;
    });

    const ctx = document.getElementById("txChart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: xAxisLabels,
        datasets: [{
          label: "Confirmed Bitcoin Transactions Per Day",
          data: txCounts,
          borderColor: "rgba(255, 165, 0, 1)",
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 0,
          lineTension: 0.3,
          fill: true,
          backgroundColor: "rgba(128, 128, 128, 0.3)"
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: false,
              fontColor: "rgba(255, 255, 255, 0.7)",
              padding: 10,
              callback: function (value) {
                return value.toLocaleString();
              }
            },
            scaleLabel: {
              display: true,
              labelString: 'Confirmed Bitcoin Transactions Per Day',
              fontColor: "rgba(255, 255, 255, 0.7)"
            },
            gridLines: {
              color: "rgba(255, 255, 255, 0.03)",
              drawBorder: true,
              drawTicks: false,
              zeroLineColor: "rgba(255, 255, 255, 0.03)"
            }
          }],
          xAxes: [{
            ticks: {
              autoSkip: true,
              maxRotation: 45,
              minRotation: 45,
              maxTicksLimit: 20,
              fontColor: "rgba(255, 255, 255, 0.7)",
              padding: 10
            },
            gridLines: {
              color: "rgba(255, 255, 255, 0.03)",
              drawBorder: true,
              drawTicks: false,
              zeroLineColor: "rgba(255, 255, 255, 0.03)"
            }
          }]
        },
        tooltips: {
          callbacks: {
            title: function (tooltipItems) {
              return labels[tooltipItems[0].index];
            },
            label: function (tooltipItem) {
              return tooltipItem.yLabel.toLocaleString() + " TX";
            }
          }
        },
        legend: {
          display: false
        },
        plugins: {
          datalabels: {
            display: false
          }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching Bitcoin transaction data:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchBitcoinTxData);