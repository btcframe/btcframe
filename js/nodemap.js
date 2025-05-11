// Initialize the map with the correct zoom level and settings

var map;
function initializeMap() {
  map = L.map("map", {
    zoomControl: false,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    maxBoundsViscosity: 1.0, // Prevent dragging outside the bounds
  }).setView([40, 0], 2);

  L.tileLayer(
    "https://api.mapbox.com/styles/v1/rhxo/cly1iiim500a301qj7hungh0i/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicmh4byIsImEiOiJjbHkwbWJ3dWcwbmx4MmxvdTZjbHlhazFqIn0.ekIsBr10vSW56b5Cbzoq6g",
    {
      maxZoom: 18,
      tileSize: 512,
      zoomOffset: -1,
      noWrap: true, // Prevent the map from wrapping horizontally
      bounds: [
        [-85, -180],
        [85, 180],
      ],
    }
  ).addTo(map);

  map.setMaxBounds([
    [-85, -180],
    [85, 180],
  ]);

  function isValidCoordinate(lat, lng) {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  const CACHE_KEY = "nodesCache";
  const CACHE_TIMESTAMP_KEY = "cacheTimestamp";

  async function fetchNodes() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    // Check if cache is valid (within 4 hours)
    if (cachedData && cachedTimestamp && Date.now() - cachedTimestamp < 14400000) {
      console.log("Using cached data");
      return JSON.parse(cachedData);
    }

    try {
      console.log("Fetching new data from API");
      const response = await fetch(
        "https://nodemap.btcframe.com/"
      );
      const data = await response.json();

      // Safely store in localStorage with Safari error handling
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.nodes));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (storageError) {
        // If storage fails, just continue with the data we have
        console.warn("Error storing in localStorage:", storageError.message);
      }

      return data.nodes;
    } catch (error) {
      console.error("Error fetching data:", error);
      return cachedData ? JSON.parse(cachedData) : null;
    }
  }

  function addNodesToMap(nodes) {
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const keys = Object.keys(nodes);

    keys.forEach((key) => {
      const node = nodes[key];
      const latitude = parseFloat(node[8]);
      const longitude = parseFloat(node[9]);
      if (isValidCoordinate(latitude, longitude)) {
        var circleMarker = L.circleMarker([latitude, longitude], {
          radius: 3,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
          renderer: canvasRenderer
        });
        circleMarker.addTo(map);
      }
    });
  }

  async function main() {
    const nodes = await fetchNodes();
    if (nodes) {
      addNodesToMap(nodes);
    }
  }

  main();

  setInterval(main, 14400000); // 14400000 ms = 4 hours
}

function handlePageVisibility() {
  var currentPage = window.location.hash;

  document.querySelectorAll(".page").forEach(function (page) {
    if ("#" + page.id === currentPage) {
      page.style.visibility = "visible";
      if (page.id === "page8" && !map) {
        initializeMap();
        updateNodeCount();
      } else if (map) {
      }
    } else {
      page.style.visibility = "hidden";
    }
  });
}

window.addEventListener("load", function () {
  handlePageVisibility();
});

window.addEventListener("hashchange", function () {
  handlePageVisibility();
});

const NODE_COUNT_CACHE_KEY = "nodeCountCache";
const NODE_COUNT_TIMESTAMP_KEY = "nodeCountTimestamp";

async function fetchNodeCount() {
  const cachedCount = localStorage.getItem(NODE_COUNT_CACHE_KEY);
  const cachedCountTimestamp = localStorage.getItem(NODE_COUNT_TIMESTAMP_KEY);

  if (cachedCount && cachedCountTimestamp && Date.now() - cachedCountTimestamp < 14400000) {
    console.log("Using cached node count");
    return parseInt(cachedCount, 10);
  }

  try {
    console.log("Fetching new node count from API");
    const response = await fetch("https://nodemap.btcframe.com/");
    const data = await response.json();
    const nodeCount = Object.keys(data.nodes).length;

    // Safely store in localStorage with Safari error handling
    try {
      localStorage.setItem(NODE_COUNT_CACHE_KEY, nodeCount.toString());
      localStorage.setItem(NODE_COUNT_TIMESTAMP_KEY, Date.now().toString());
    } catch (storageError) {
      // If storage fails, just continue with the count we have
      console.warn("Error storing count in localStorage:", storageError.message);
    }

    return nodeCount;
  } catch (error) {
    console.error("Error fetching node count:", error);
    return cachedCount ? parseInt(cachedCount, 10) : 0;
  }
}

function formatNumber(number) {
  return number.toLocaleString();
}

async function updateNodeCount() {
  const nodeCount = await fetchNodeCount();
  document.getElementById("node-count").textContent = formatNumber(nodeCount);
}

updateNodeCount();
setInterval(updateNodeCount, 14400000); // 14400000 ms = 4 hours