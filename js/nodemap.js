// Initialize the map with the correct zoom level and settings

var map;
function initializeMap() {
  map = L.map("map", {
    zoomControl: false, // Disable the zoom control buttons
    dragging: false, // Disable dragging
    touchZoom: false, // Disable touch zoom
    scrollWheelZoom: false, // Disable scroll wheel zoom
    doubleClickZoom: false, // Disable double click zoom
    boxZoom: false, // Disable box zoom
    keyboard: false, // Disable keyboard navigation
    tap: false, // Disable tap navigation
    maxBoundsViscosity: 1.0, // Prevent dragging outside the bounds
  }).setView([40, 0], 2); // Set the initial view

  // Add custom tile layer with Mapbox style and desired background color
  L.tileLayer(
    "https://api.mapbox.com/styles/v1/rhxo/cly1iiim500a301qj7hungh0i/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicmh4byIsImEiOiJjbHkwbWJ3dWcwbmx4MmxvdTZjbHlhazFqIn0.ekIsBr10vSW56b5Cbzoq6g",
    {
      maxZoom: 18, // Set max zoom level to prevent excessive zooming
      tileSize: 512,
      zoomOffset: -1,
      noWrap: true, // Prevent the map from wrapping horizontally
      bounds: [
        [-85, -180],
        [85, 180],
      ], // Set the bounds to prevent repeating
    }
  ).addTo(map);

  // Set max bounds to restrict the view and prevent map repetition
  map.setMaxBounds([
    [-85, -180],
    [85, 180],
  ]);

  // Function to check if the coordinates are valid numbers
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

  // Cache keys for localStorage
  const CACHE_KEY = "nodesCache";
  const CACHE_TIMESTAMP_KEY = "cacheTimestamp";

  // Function to fetch Bitcoin nodes data asynchronously
  async function fetchNodes() {
    // Retrieve cached data and timestamp from localStorage
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    // Check if cache is valid (within 4 hours)
    if (cachedData && cachedTimestamp && Date.now() - cachedTimestamp < 14400000) {
      console.log("Using cached data");
      return JSON.parse(cachedData); // Return cached data
    }

    // Fetch new data if cache is invalid or doesn't exist
    try {
      console.log("Fetching new data from API");
      const response = await fetch(
        "https://bitnodes.io/api/v1/snapshots/latest/"
      );
      const data = await response.json();

      // Update localStorage with new data and timestamp
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.nodes));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

      return data.nodes;
    } catch (error) {
      console.error("Error fetching data:", error);
      // Fallback to cached data if available, even if outdated
      return cachedData ? JSON.parse(cachedData) : null;
    }
  }

  // Function to add nodes to the map using a canvas renderer
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

  // Main function to fetch and render nodes
  async function main() {
    const nodes = await fetchNodes();
    if (nodes) {
      addNodesToMap(nodes);
    }
  }

  // Initial fetch and render
  main();

  // Set interval to fetch and update data every 4 hours (14400000 milliseconds)
  setInterval(main, 14400000); // 14400000 ms = 4 hours
}

function handlePageVisibility() {
  var currentPage = window.location.hash;

  document.querySelectorAll(".page").forEach(function (page) {
    if ("#" + page.id === currentPage) {
      page.style.visibility = "visible";
      if (page.id === "page8" && !map) {
        initializeMap();
      } else if (map) {
      }
    } else {
      page.style.visibility = "hidden";
    }
  });
}

// Initialize map on load if hash is page8
window.addEventListener("load", function () {
  handlePageVisibility();
});

// Handle hash change for navigation
window.addEventListener("hashchange", function () {
  handlePageVisibility();
});

// *** CHANGED SECTION BELOW ***
// Add localStorage-based caching (4 hours) to fetchNodeCount()
const NODE_COUNT_CACHE_KEY = "nodeCountCache";
const NODE_COUNT_TIMESTAMP_KEY = "nodeCountTimestamp";

async function fetchNodeCount() {
  // Check if we have a cached nodeCount
  const cachedCount = localStorage.getItem(NODE_COUNT_CACHE_KEY);
  const cachedCountTimestamp = localStorage.getItem(NODE_COUNT_TIMESTAMP_KEY);

  // If cache is valid (< 4 hours), use it
  if (cachedCount && cachedCountTimestamp && Date.now() - cachedCountTimestamp < 14400000) {
    console.log("Using cached node count");
    return parseInt(cachedCount, 10);
  }

  // Otherwise, fetch fresh data
  try {
    console.log("Fetching new node count from API");
    const response = await fetch("https://bitnodes.io/api/v1/snapshots/latest/");
    const data = await response.json();
    const nodeCount = Object.keys(data.nodes).length;

    // Update localStorage
    localStorage.setItem(NODE_COUNT_CACHE_KEY, nodeCount.toString());
    localStorage.setItem(NODE_COUNT_TIMESTAMP_KEY, Date.now().toString());

    return nodeCount;
  } catch (error) {
    console.error("Error fetching node count:", error);
    // Fallback to cached count if available
    return cachedCount ? parseInt(cachedCount, 10) : 0;
  }
}
// *** END OF CHANGED SECTION ***

function formatNumber(number) {
  return number.toLocaleString();
}

async function updateNodeCount() {
  const nodeCount = await fetchNodeCount();
  document.getElementById("node-count").textContent = formatNumber(nodeCount);
}

// Call the updateNodeCount function to update the node count
updateNodeCount();
setInterval(updateNodeCount, 14400000); // Update every 4 hours

// Ensure this function is called when page 8 is active
function handlePageVisibility() {
  var currentPage = window.location.hash;

  document.querySelectorAll(".page").forEach(function (page) {
    if ("#" + page.id === currentPage) {
      page.style.visibility = "visible";
      if (page.id === "page8" && !map) {
        initializeMap();
        updateNodeCount(); // Ensure node count is updated when page 8 is initialized
      } else if (map) {
      }
    } else {
      page.style.visibility = "hidden";
    }
  });
}
