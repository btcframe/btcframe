document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowRight":
      // Navigate to the next slide
      if (typeof showNextPage === "function") {
        showNextPage();
      }
      break;
    case "ArrowLeft":
      // Navigate to the previous slide
      if (typeof showPrevPage === "function") {
        showPrevPage();
      }
      break;
    case "Space":
      // Toggle play/pause
      if (typeof togglePlayPause === "function") {
        togglePlayPause();
        event.preventDefault(); // Prevent default scrolling behavior
      }
      break;
    default:
      break;
  }
});
