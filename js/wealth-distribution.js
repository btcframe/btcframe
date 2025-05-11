document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("wealth-distribution-container");

  if (!container) {
    return;
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("transform", "translate(500, 30)");
  svg.appendChild(group);

  const colors = ["#fff2e0", "#ffddad", "#ffc97b", "#ffb347", "#ff9f13", "#e08301", "#ad6600"];

  // Cache settings
  const CACHE_KEY = "bitcoinData";
  const CACHE_TIMESTAMP_KEY = "bitcoinDataTimestamp";
  const CACHE_EXPIRATION_TIME = 4 * 60 * 60 * 1000; // 4 hours

  const getCachedData = () => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const currentTime = new Date().getTime();

    if (cachedData && cachedTimestamp && currentTime - cachedTimestamp < CACHE_EXPIRATION_TIME) {
      return JSON.parse(cachedData);
    } else {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
  };

  const cacheData = (data) => {
    const currentTime = new Date().getTime();
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, currentTime.toString());
  };

  const fetchData = async () => {
    try {
      // Directly fetch data from the new URL (no proxy needed)
      const dataUrl = "https://address-distribution.btcframe.com/proxy";
      const response = await fetch(dataUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const table = doc.querySelectorAll("table.table-condensed")[1];
      if (!table) throw new Error("Data table not found!");

      const rows = table.querySelectorAll("tbody tr");
      if (rows.length < 2) throw new Error("Incomplete data rows!");

      const addressCells = rows[1].querySelectorAll("td");
      const addresses = Array.from(addressCells).map((cell) => cell.textContent.trim());

      if (addresses.length !== 7) throw new Error("Unexpected number of address columns!");
      return addresses.reverse(); // Reverse to match the pyramid layout
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  const initPyramid = async () => {
    let addresses = getCachedData();
    if (!addresses) {
      addresses = await fetchData();
      if (addresses) {
        cacheData(addresses);
      } else {
        return;
      }
    }

    const leftLabels = addresses.map((text, i) => ({
      y: [50, 150, 270, 400, 550, 720, 900][i],
      text,
    }));

    const rightLabels = [
      { y: 50, text: "> $10M" },
      { y: 150, text: "> $1M" },
      { y: 270, text: "> $100K" },
      { y: 400, text: "> $10K" },
      { y: 550, text: "> $1K" },
      { y: 720, text: "> $100" },
      { y: 900, text: "> $1" },
    ];

    const pyramidLayers = [
      { d: "M0,0 L140,50 L-140,50 Z", fill: colors[6], opacity: "0.95" },
      { d: "M-140,50 L140,50 L160,150 L-160,150 Z", fill: colors[5], opacity: "0.9" },
      { d: "M-160,150 L160,150 L180,270 L-180,270 Z", fill: colors[4], opacity: "0.9" },
      { d: "M-180,270 L180,270 L200,400 L-200,400 Z", fill: colors[3], opacity: "0.9" },
      { d: "M-200,400 L200,400 L220,550 L-220,550 Z", fill: colors[2], opacity: "0.9" },
      { d: "M-220,550 L220,550 L240,720 L-240,720 Z", fill: colors[1], opacity: "0.9" },
      { d: "M-240,720 L240,720 L260,900 L-260,900 Z", fill: colors[0], opacity: "0.9" },
    ];

    pyramidLayers.forEach(({ d, fill, opacity }, index) => {
      const layer = document.createElementNS("http://www.w3.org/2000/svg", "path");
      layer.setAttribute("d", d);
      layer.setAttribute("fill", fill);
      layer.setAttribute("opacity", opacity);
      group.appendChild(layer);

      const { y: leftY, text: leftText } = leftLabels[index];
      const leftLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      leftLabel.setAttribute("x", "-350");
      leftLabel.setAttribute("y", leftY);
      leftLabel.setAttribute("text-anchor", "end");
      leftLabel.setAttribute("font-size", "30");
      leftLabel.setAttribute("fill", fill); // Match text color to block
      leftLabel.textContent = leftText;
      group.appendChild(leftLabel);

      const { y: rightY, text: rightText } = rightLabels[index];
      const rightLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      rightLabel.setAttribute("x", "350");
      rightLabel.setAttribute("y", rightY);
      rightLabel.setAttribute("text-anchor", "start");
      rightLabel.setAttribute("font-size", "30");
      rightLabel.setAttribute("fill", fill); // Match text color to block
      rightLabel.textContent = rightText;
      group.appendChild(rightLabel);
    });

    const lines = [
      { x1: -340, y1: 50, x2: -140, y2: 50 },
      { x1: -340, y1: 150, x2: -160, y2: 150 },
      { x1: -340, y1: 270, x2: -180, y2: 270 },
      { x1: -340, y1: 400, x2: -200, y2: 400 },
      { x1: -340, y1: 550, x2: -220, y2: 550 },
      { x1: -340, y1: 720, x2: -240, y2: 720 },
      { x1: -340, y1: 900, x2: -260, y2: 900 },
      { x1: 140, y1: 50, x2: 340, y2: 50 },
      { x1: 160, y1: 150, x2: 340, y2: 150 },
      { x1: 180, y1: 270, x2: 340, y2: 270 },
      { x1: 200, y1: 400, x2: 340, y2: 400 },
      { x1: 220, y1: 550, x2: 340, y2: 550 },
      { x1: 240, y1: 720, x2: 340, y2: 720 },
      { x1: 260, y1: 900, x2: 340, y2: 900 },
    ];
    lines.forEach(({ x1, y1, x2, y2 }) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#94a3b8");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("opacity", "0.3");
      group.appendChild(line);
    });

    const columnLabels = [
      { x: -350, y: 950, text: "Total number of addresses", anchor: "end" },
      { x: 350, y: 950, text: "USD Value", anchor: "start" },
    ];
    columnLabels.forEach(({ x, y, text, anchor }) => {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x);
      label.setAttribute("y", y);
      label.setAttribute("text-anchor", anchor);
      label.setAttribute("font-size", "20");
      label.setAttribute("fill", "#64748b");
      label.textContent = text;
      group.appendChild(label);
    });

    const footer = document.createElementNS("http://www.w3.org/2000/svg", "text");
    footer.setAttribute("x", "500");
    footer.setAttribute("y", "980");
    footer.setAttribute("text-anchor", "middle");
    footer.setAttribute("font-size", "18");
    footer.setAttribute("fill", "#64748b");
    footer.textContent = "Distribution of Bitcoin addresses by value held";
    svg.appendChild(footer);

    container.appendChild(svg);
  };

  await initPyramid();
});
