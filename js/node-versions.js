function handlePageVisibilityForNodeVersions() {
  const currentPage = window.location.hash;
  if (currentPage === "#page22") {
    fetchNodeVersions().then(renderNodeVersions);
  }
}

window.addEventListener("load", handlePageVisibilityForNodeVersions);
window.addEventListener("hashchange", handlePageVisibilityForNodeVersions);

// Same cache as nodemap.js
async function fetchNodeVersions() {
  const cachedData = localStorage.getItem("nodesCache");
  const cachedTimestamp = localStorage.getItem("cacheTimestamp");

  if (cachedData && cachedTimestamp && Date.now() - cachedTimestamp < 14400000) {
    console.log("Using shared node cache from nodemap.js");
    return processNodeVersions(JSON.parse(cachedData));
  }

  console.log("Fetching fresh data for versions");
  const res = await fetch("https://nodemap.btcframe.com/");
  const data = await res.json();

  try {
    localStorage.setItem("nodesCache", JSON.stringify(data.nodes));
    localStorage.setItem("cacheTimestamp", Date.now().toString());
  } catch (e) {
    console.warn("Could not store shared cache:", e.message);
  }

  return processNodeVersions(data.nodes);
}

// Parse version data and counts (Core + Knots totals)
function processNodeVersions(nodes) {
  const versionStats = {};
  let coreTotal = 0;
  let knotsTotal = 0;

  for (const node of Object.values(nodes)) {
    const raw = node[1] || "Unknown";
    let display = raw;

    if (raw.includes("Knots:")) {
      const match = raw.match(/Knots:[^/]+/);
      display = match ? match[0] : "Knots";
      knotsTotal++;
    } else if (raw.includes("Satoshi:")) {
      const match = raw.match(/Satoshi:[^/]+/);
      display = match ? match[0].replace("Satoshi", "Core") : "Core";
      coreTotal++;
    } else {
      display = raw.replace(/\//g, "");
    }

    // Normalize labels
    display = display.replace(/\(FutureBit-Apollo-Node\)/g, "(FutureBit Apollo)");
    display = display.replace(/\//g, "");

    versionStats[display] = (versionStats[display] || 0) + 1;
  }

  return {
    versionBreakdown: versionStats,
    coreTotal,
    knotsTotal
  };
}

function renderNodeVersions({ versionBreakdown, coreTotal, knotsTotal }) {
  const tableBody = document.querySelector("#node-version-table tbody");
  tableBody.innerHTML = "";

  const sorted = Object.entries(versionBreakdown).sort((a, b) => b[1] - a[1]);

  for (const [version, count] of sorted.slice(0, 15)) {
    const row = document.createElement("tr");
    const totalCount = Object.keys(JSON.parse(localStorage.getItem("nodesCache") || "{}")).length;
    row.innerHTML = `
      <td>${version}</td>
      <td>${count.toLocaleString()}</td>
      <td>${((count / totalCount) * 100).toFixed(2)}%</td>
    `;
    tableBody.appendChild(row);
  }

  const totalNodes = Object.keys(JSON.parse(localStorage.getItem("nodesCache") || "{}")).length;
  drawPieChart(coreTotal, knotsTotal, totalNodes);
}

function drawPieChart(core, knots, total) {
  const ctx = document.getElementById("versionPieChart").getContext("2d");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Core", "Knots"],
      datasets: [{
        data: [core, knots],
        backgroundColor: ["#f7931a", "#006838"],
        borderColor: "#202023",
        borderWidth: 4
      }]
    },
    options: {
      responsive: false,
      cutoutPercentage: 60,
      legend: {
        position: "bottom",
        labels: {
          fontColor: "#eee"
        }
      },
      plugins: {
        datalabels: {
          color: "#fff",
          font: {
            weight: "bold",
            size: 14
          },
          formatter: (value) => `${((value / total) * 100).toFixed(1)}%`
        }
      }
    },
    plugins: [
      Chart.plugins.getAll().concat(ChartDataLabels),
      {
        afterDraw: function(chart) {
          const ctx = chart.chart.ctx;
          ctx.save();
          ctx.font = "bold 20px Jost";
          ctx.fillStyle = "#eee";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${total.toLocaleString()} Nodes`, chart.chart.width / 2, chart.chart.height / 2);
          ctx.restore();
        }
      }
    ]
  });
}
