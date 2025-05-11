// Make navigation functions available globally
window.showNextPage = showNextPage;
window.showPrevPage = showPrevPage;
window.togglePlayPause = togglePlayPause;
window.toggleFullscreen = toggleFullscreen;

// Global variables
window.globalCurrentPrice = 0;
window.globalChange = 0;
window.globalCurrentHashrate = 0;
window.globalChartDate = new Date().toISOString().split('T')[0].substring(5).replace('-', '.');
window.CACHE_KEY = 'btcFrameCache';
window.CACHE_EXPIRY = 20 * 60 * 1000;

// Navigation state
let isPlaying = true;
let timerInterval;
let countdown = 60; // Rotate pages every 60 seconds
let currentPage = 0; // This will be updated from the DOM

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.page');
  window.pageCount = pages.length;
  document.getElementById('page-counter').textContent = `${currentPage + 1}/${window.pageCount}`;

  // Check for hash in URL
  const hash = window.location.hash;
  if (hash) {
    const pageNumber = parseInt(hash.replace('#page', ''), 10) - 1;
    if (pageNumber >= 0 && pageNumber < window.pageCount) {
      // Remove active class from whichever page is active
      document.querySelector('.page.active')?.classList.remove('active');
      currentPage = pageNumber;
      pages[currentPage].classList.add('active');
    }
    if (pageNumber === 5) {
      document.querySelector('.svelte-1onyhi4')?.classList.add('active');
    } else {
      document.querySelector('.svelte-1onyhi4')?.classList.remove('active');
    }
  }

  startTimer();
  updateDateTime();
  setInterval(updateDateTime, 1000);
});

function showNextPage() {
  clearInterval(timerInterval); // Stop the current timer

  // Get all pages as an array
  const pages = Array.from(document.querySelectorAll('.page'));

  // Determine the currently active page by checking for the "active" class
  let activeIndex = pages.findIndex(p => p.classList.contains('active'));
  if (activeIndex === -1) {
    activeIndex = 0; // Fallback in case none is active
  }

  // Remove the active class from the current page
  pages[activeIndex].classList.remove('active');

  // Remove active state from the Svelte element if applicable
  const svelte = document.querySelector('.svelte-1onyhi4');
  if (svelte) svelte.classList.remove('active');

  // Compute the index of the next page (wrap-around if needed)
  const nextIndex = (activeIndex + 1) % pages.length;
  pages[nextIndex].classList.add('active');
  window.location.hash = `page${nextIndex + 1}`;
  currentPage = nextIndex; // Keep global in sync

  // Restart the timer immediately
  if (isPlaying) {
    startTimer();
  }

  // Handle page-specific logic
  if (nextIndex === 1 && typeof window.myChart !== 'undefined') {
    setTimeout(() => {
      try {
        window.myChart.resize();
        window.myChart.update();
      } catch (error) {
        // Silently handle errors if any
      }
    }, 0); // Defer chart resizing to avoid blocking the timer reset
  }

  if (nextIndex === 2) {
    if (!window.isFlapperInitialized) {
      typeof initializeFlappers === 'function' && initializeFlappers();
      window.isFlapperInitialized = true;
    }
    typeof fetchFlapperData === 'function' && fetchFlapperData();
  }

  if (nextIndex === 5) {
    setTimeout(() => {
      const svelte = document.querySelector('.svelte-1onyhi4');
      if (svelte) svelte.classList.add('active');
    }, 150);
  }
}

function showPrevPage() {
  clearInterval(timerInterval); // Stop the current timer

  const pages = Array.from(document.querySelectorAll('.page'));
  let activeIndex = pages.findIndex(p => p.classList.contains('active'));
  if (activeIndex === -1) {
    activeIndex = 0;
  }

  pages[activeIndex].classList.remove('active');

  const svelte = document.querySelector('.svelte-1onyhi4');
  if (svelte) svelte.classList.remove('active');

  // Compute the previous page index (wrap-around if needed)
  const prevIndex = (activeIndex - 1 + pages.length) % pages.length;
  pages[prevIndex].classList.add('active');
  window.location.hash = `page${prevIndex + 1}`;
  currentPage = prevIndex; // Update global

  // Restart the timer immediately
  if (isPlaying) {
    startTimer();
  }

  // Handle page-specific logic
  if (prevIndex === 2) {
    if (!window.isFlapperInitialized) {
      typeof initializeFlappers === 'function' && initializeFlappers();
      window.isFlapperInitialized = true;
    }
    typeof fetchFlapperData === 'function' && fetchFlapperData();
  }

  if (prevIndex === 5) {
    const svelte = document.querySelector('.svelte-1onyhi4');
    if (svelte) svelte.classList.add('active');
  }
}

function togglePlayPause() {
  const button = document.getElementById("play-pause-btn");
  if (isPlaying) {
    clearInterval(timerInterval);
    button.innerHTML = '<i class="fas fa-play"></i>';
  } else {
    startTimer();
    button.innerHTML = '<i class="fas fa-pause"></i>';
  }
  isPlaying = !isPlaying;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function startTimer() {
  // Always clear any existing timer first
  clearInterval(timerInterval);

  // Reset countdown and update the play-pause button's visual immediately
  countdown = 60;
  const totalTime = countdown;
  const playPauseBtn = document.getElementById("play-pause-btn");
  if (playPauseBtn) {
    playPauseBtn.style.background = `conic-gradient(#ffae42 0%, #444 0%, #444 100%)`;
  }

  // Start a new interval timer
  timerInterval = setInterval(() => {
    countdown--;
    const progress = ((totalTime - countdown) / totalTime) * 100;
    if (playPauseBtn) {
      playPauseBtn.style.background = `conic-gradient(
        #ffae42 ${progress}%,
        #444 ${progress}%,
        #444 100%)`;
    }

    // When the countdown reaches 0 (or below), rotate to the next page
    if (countdown === 0) {
      clearInterval(timerInterval);
      showNextPage();
    }
  }, 1000);
}

function updateDateTime() {
  const dateTimeElement = document.getElementById('date-time');
  const now = new Date();
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  dateTimeElement.innerHTML = now.toLocaleString('en-US', options);
}

function calculateMovingAverage(data, windowSize) {
  let movingAverages = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      movingAverages.push(null);
    } else {
      let window = data.slice(i - windowSize + 1, i + 1);
      let average = window.reduce((sum, value) => sum + value, 0) / windowSize;
      movingAverages.push(average);
    }
  }
  return movingAverages;
}