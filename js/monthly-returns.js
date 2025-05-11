document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("monthlyReturnsCanvas");
  const ctx = canvas.getContext("2d");

  const staticReturns = {
    2013: [+44.05, +61.77, +172.76, +50.01, -8.56, -29.89, +9.6, +30.42, +26.73, +84.9, +449.35, -34.81],
    2014: [+10.03, -31.03, -17.25, -1.6, +39.46, +2.2, -9.69, -17.55, -19.01, -12.95, +12.82, -15.11],
    2015: [-33.05, +18.43, -4.38, -3.46, -3.17, +15.19, +8.2, -18.67, +2.35, +33.49, +19.27, +13.83],
    2016: [-14.83, +20.08, -5.35, +7.27, +18.78, +27.14, -7.67, -7.49, +6.04, +14.71, +5.42, +30.8],
    2017: [-0.04, +23.07, -9.05, +32.71, +52.71, +10.45, +17.92, +65.32, -7.44, +47.81, +53.48, +38.89],
    2018: [-25.41, +0.47, -32.85, +33.43, -18.99, -14.62, +20.96, -9.27, -5.58, -3.83, -36.57, -5.15],
    2019: [-8.58, +11.14, +7.05, +34.36, +52.38, +26.67, -6.59, -4.6, -13.38, +10.17, -17.27, -5.15],
    2020: [+29.95, -8.6, -24.92, +34.26, +9.51, -3.18, +24.03, +2.83, -7.51, +27.7, +42.95, +46.92],
    2021: [+14.51, +36.78, +29.84, -1.98, -35.31, -5.95, +18.19, +13.8, -7.03, +39.93, -7.11, -18.9],
    2022: [-16.68, +12.21, +5.39, -17.3, -15.6, -37.28, +16.8, -13.88, -3.12, +5.56, -16.23, -3.59],
    2023: [+39.63, +0.03, +22.96, +2.81, -6.98, +11.98, -4.02, -11.29, +3.91, +28.52, +8.81, +12.18],
    2024: [+0.62, +43.55, +16.81, -14.76, +11.07, -6.96, +2.95, -8.6, +7.29, +10.76, +37.29, -2.85]
  };

  const fetch2025Data = async () => {
    const now = new Date();
    if (now.getFullYear() !== 2025) return null;
    const monthly = new Array(12).fill(null);

    for (let m = 0; m <= now.getMonth(); m++) {
      const openDate = new Date(2025, m, 1);
      const openTs = Math.floor(openDate.getTime() / 1000);

      let closeTs;
      if (m === now.getMonth()) {
        closeTs = Math.floor(Date.now() / 1000);
      } else {
        const closeDate = new Date(2025, m + 1, 0);
        closeTs = Math.floor(closeDate.getTime() / 1000);
      }

      try {
        const openRes = await fetch(`https://mempool.btcframe.com/api/v1/historical-price?currency=USD&timestamp=${openTs}`);
        const openJson = await openRes.json();
        const openPrice = openJson?.prices?.[0]?.USD;

        const closeRes = await fetch(`https://mempool.btcframe.com/api/v1/historical-price?currency=USD&timestamp=${closeTs}`);
        const closeJson = await closeRes.json();
        const closePrice = closeJson?.prices?.[0]?.USD;

        if (typeof openPrice === "number" && typeof closePrice === "number" && openPrice !== 0) {
          monthly[m] = ((closePrice - openPrice) / openPrice) * 100;
        }
      } catch {
        monthly[m] = null;
      }
    }

    return monthly;
  };

  const returns2025 = await fetch2025Data();
  if (returns2025) staticReturns[2025] = returns2025;

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = Object.keys(staticReturns).map(Number).sort((a, b) => b - a);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const LABEL_WIDTH = 40;

  function draw() {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const chartWidth = width * 0.96 - LABEL_WIDTH;
    const chartHeight = height * 0.85;
    const CELL_WIDTH = chartWidth / MONTHS.length;
    const CELL_HEIGHT = chartHeight / (years.length + 2.5);
    const MARGIN_LEFT = ((width - chartWidth) / 2) + (LABEL_WIDTH / 2);
    const MARGIN_TOP = (height - (CELL_HEIGHT * (years.length + 2.5))) / 2;

    const getColor = val => {
      if (val == null) return "#444";
      return val >= 0 ? "#51cc8c" : "#fc7172";
    };

    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    MONTHS.forEach((month, i) => {
      ctx.fillStyle = "white";
      ctx.fillText(month, MARGIN_LEFT + i * CELL_WIDTH + CELL_WIDTH / 2, MARGIN_TOP - CELL_HEIGHT / 1.5);
    });

    years.forEach((year, rowIdx) => {
      const y = MARGIN_TOP + rowIdx * CELL_HEIGHT;
      ctx.fillStyle = "white";
      ctx.fillText(year, MARGIN_LEFT - LABEL_WIDTH / 1.2, y + CELL_HEIGHT / 2);

      staticReturns[year].forEach((val, colIdx) => {
        const x = MARGIN_LEFT + colIdx * CELL_WIDTH;
        ctx.fillStyle = getColor(val);
        ctx.fillRect(x, y, CELL_WIDTH - 2, CELL_HEIGHT - 2);

        if (val != null) {
          ctx.fillStyle = "#fff";
          ctx.fillText(`${val >= 0 ? "+" : ""}${val.toFixed(1)}%`, x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2);

          if (year === currentYear && colIdx === currentMonth) {
            // Flashing dot in top-left
            const dotColor = val > 0 ? "#008c2b" : val < 0 ? "#990000" : "#666";
            const cycle = 2000;
            const time = Date.now() % cycle;
            const visible = time < 400 || (time >= 1000 && time < 1400) || time >= 1900;

            ctx.globalAlpha = visible ? 1 : 0;
            ctx.beginPath();
            ctx.arc(x + 8, y + 8, 4, 0, 2 * Math.PI);
            ctx.fillStyle = dotColor;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      });
    });

    // Avg & Median rows
    MONTHS.forEach((_, colIdx) => {
      const x = MARGIN_LEFT + colIdx * CELL_WIDTH;
      const yAvg = MARGIN_TOP + years.length * CELL_HEIGHT + 10;
      const yMed = yAvg + CELL_HEIGHT;

      const values = years.map(y => staticReturns[y][colIdx]).filter(n => typeof n === "number" && isFinite(n));
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const med = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

      ctx.fillStyle = "#bcbcbc";
      ctx.fillRect(x, yAvg, CELL_WIDTH - 2, CELL_HEIGHT - 2);
      ctx.fillStyle = "#fff";
      ctx.fillText(`${avg.toFixed(1)}%`, x + CELL_WIDTH / 2, yAvg + CELL_HEIGHT / 2);

      ctx.fillStyle = "#bcbcbc";
      ctx.fillRect(x, yMed, CELL_WIDTH - 2, CELL_HEIGHT - 2);
      ctx.fillStyle = "#fff";
      ctx.fillText(`${med.toFixed(1)}%`, x + CELL_WIDTH / 2, yMed + CELL_HEIGHT / 2);
    });

    const yStats = MARGIN_TOP + years.length * CELL_HEIGHT + 10;
    ctx.fillStyle = "white";
    ctx.fillText("Average", MARGIN_LEFT - LABEL_WIDTH / 1.2, yStats + CELL_HEIGHT / 2);
    ctx.fillText("Median", MARGIN_LEFT - LABEL_WIDTH / 1.2, yStats + CELL_HEIGHT + CELL_HEIGHT / 2);

    requestAnimationFrame(draw);
  }

  draw();
});
