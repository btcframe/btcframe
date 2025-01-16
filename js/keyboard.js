document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowRight":

      if (typeof showNextPage === "function") {
        showNextPage();
      }
      break;
    case "ArrowLeft":

      if (typeof showPrevPage === "function") {
        showPrevPage();
      }
      break;
    case "Space":

      if (typeof togglePlayPause === "function") {
        togglePlayPause();
        event.preventDefault();
      }
      break;
    case "Home":

      if (typeof navigateToFirstPage === "function") {
        navigateToFirstPage();
      }
      break;
    default:
      break;
  }
});

// Home button support for ir remote control
function navigateToFirstPage() {
  const pages = document.querySelectorAll(".page");

  if (pages.length > 0) {

    pages.forEach((page) => page.classList.remove("active"));

    pages[0].classList.add("active");

    if (typeof currentPage !== "undefined") {
      currentPage = 0;
    }
  }
}