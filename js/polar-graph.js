document.addEventListener('DOMContentLoaded', () => {
  let refreshInterval;

  function refreshPolarGraph() {
    const imgElement = document.querySelector('.centered-polar-image'); // Target by class
    if (imgElement) {
      const baseUrl = "https://btcframe.com/static/polar-graph.php?paramsFile=likeAlice&size=925";
      const timestamp = new Date().getTime();
      imgElement.src = `${baseUrl}&t=${timestamp}`; // Append timestamp to prevent caching
    }
  }

  function monitorPage() {
    const page18 = document.getElementById('page18');
    if (page18 && page18.classList.contains('active')) {
      if (!refreshInterval) {
        refreshInterval = setInterval(refreshPolarGraph, 300000); // Refresh every 5 minutes
        refreshPolarGraph(); // Trigger an immediate refresh
      }
    } else {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // Monitor for page changes every second
  setInterval(monitorPage, 1000);
});
