document.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "ArrowRight":
      if (typeof showNextPage === "function") {
        const nextBtn = document.getElementById('next-btn');
        nextBtn.style.color = '#ffae42';
        showNextPage();
      }
      break;
    case "ArrowLeft":
      if (typeof showPrevPage === "function") {
        const prevBtn = document.getElementById('prev-btn');
        prevBtn.style.color = '#ffae42';
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

document.addEventListener("keyup", (event) => {
  if (event.code === "ArrowRight") {
    const nextBtn = document.getElementById('next-btn');
    nextBtn.style.color = '#fff';
  }
  if (event.code === "ArrowLeft") {
    const prevBtn = document.getElementById('prev-btn');
    prevBtn.style.color = '#fff';
  }
});

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