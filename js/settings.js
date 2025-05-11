document.addEventListener("DOMContentLoaded", () => {
  // Only initialize if we're on the dashboard page
  if (!document.getElementById('settings-btn')) return;

  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettings = document.getElementById("close-settings");
  const saveSettingsBtn = document.getElementById("save-settings");
  const pagesContainer = document.getElementById("pages-container");
  const PAGES_KEY = "dashboardPages";

  // Backup original navigation functions
  const originalShowNextPage = window.showNextPage;
  const originalShowPrevPage = window.showPrevPage;

  // Default list of 16 pages
  const defaultPages = Array.from({ length: 16 }, (_, i) => ({
    id: `page${i + 1}`,
    name: `Page ${i + 1}`,
    img: `img/images/page${i + 1}.png`,
    enabled: true,
    originalIndex: i + 1
  }));

  /**
   * Load from localStorage or fallback to defaults
   */
  function loadPreferences() {
    try {
      const saved = localStorage.getItem(PAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((page, i) => ({
          ...page,
          originalIndex: page.originalIndex || parseInt(page.id.replace('page', ''))
        }));
      }
    } catch (error) {
      console.warn('Error loading page preferences:', error);
    }
    return defaultPages;
  }

  /**
   * Save to localStorage
   */
  function savePreferences(updatedPages) {
    try {
      localStorage.setItem(PAGES_KEY, JSON.stringify(updatedPages));
    } catch (error) {
      console.warn('Error saving page preferences:', error);
    }
  }

  /**
   * Render settings modal
   */
  function renderSettings() {
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = "";
    const userPages = loadPreferences();

    userPages.forEach((page, index) => {
      const pageItem = document.createElement("div");
      pageItem.className = "page-item";
      pageItem.dataset.index = index;
      pageItem.dataset.originalIndex = page.originalIndex;

      pageItem.innerHTML = `
        <img src="${page.img}" alt="${page.id}" />
        <span>${page.name}</span>
        <input type="checkbox" ${page.enabled ? "checked" : ""} />
        <button class="arrow-btn arrow-left" data-direction="left">⬅</button>
        <button class="arrow-btn arrow-right" data-direction="right">➡</button>
      `;

      pagesContainer.appendChild(pageItem);
    });

    attachArrowListeners();
  }

  /**
   * Handle arrow button clicks for reordering
   */
  function attachArrowListeners() {
    const arrowButtons = document.querySelectorAll(".arrow-btn");
    arrowButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent any default behavior
        const direction = e.target.dataset.direction;
        const pageItem = e.target.closest(".page-item");
        const index = Number(pageItem.dataset.index);

        const userPages = loadPreferences();

        if (direction === "left" && index > 0) {
          const temp = userPages[index];
          userPages[index] = userPages[index - 1];
          userPages[index - 1] = temp;
        } else if (direction === "right" && index < userPages.length - 1) {
          const temp = userPages[index];
          userPages[index] = userPages[index + 1];
          userPages[index + 1] = temp;
        }

        savePreferences(userPages);
        renderSettings();
      });
    });
  }

  /**
   * Update page order in DOM and handle visibility
   */
  function reorderPagesInDOM() {
    const userPages = loadPreferences();
    const container = document.body;
    const pageElements = document.querySelectorAll(".page");
    
    if (!pageElements.length) return;

    // Store current active page ID and handle Svelte app
    const currentActive = document.querySelector(".page.active");
    const currentActiveId = currentActive ? currentActive.id : null;
    
    // Ensure Svelte app is hidden when not on page 6
    if (currentActiveId !== 'page6') {
      const svelteElem = document.querySelector(".svelte-1onyhi4");
      if (svelteElem) {
        svelteElem.classList.remove("active");
      }
    }

    // Reorder pages
    userPages.forEach((page) => {
      const pageElement = document.getElementById(page.id);
      if (!pageElement) return;

      if (page.enabled) {
        pageElement.classList.remove("hidden");
        container.appendChild(pageElement);
      } else {
        pageElement.classList.add("hidden");
        pageElement.classList.remove("active");
      }
    });

    // Restore active state
    if (currentActiveId) {
      const activeElement = document.getElementById(currentActiveId);
      if (activeElement && !activeElement.classList.contains("hidden")) {
        pageElements.forEach(page => page.classList.remove("active"));
        activeElement.classList.add("active");
      }
    }

    // Update navigation functions with safeguards
    window.updatePageHash = function(pageElement) {
      if (!pageElement || !pageElement.id) return;
      const pageNumber = pageElement.id.replace('page', '');
      window.location.hash = `page${pageNumber}`;
    };

    window.showNextPage = function() {
      if (!pageElements.length) {
        if (originalShowNextPage) originalShowNextPage();
        return;
      }

      const currentPage = document.querySelector(".page.active");
      if (!currentPage) return;

      let currentIndex = Array.from(pageElements).indexOf(currentPage);
      
      do {
        currentIndex = (currentIndex + 1) % pageElements.length;
      } while (pageElements[currentIndex].classList.contains("hidden"));

      // Handle Svelte app visibility when navigating away from page 6
      if (currentPage.id === 'page6') {
        const svelteElem = document.querySelector(".svelte-1onyhi4");
        if (svelteElem) {
          svelteElem.classList.remove("active");
        }
      }

      currentPage.classList.remove("active");
      pageElements[currentIndex].classList.add("active");
      window.updatePageHash(pageElements[currentIndex]);

      // Re-trigger page-specific initialization
      const pageNumber = pageElements[currentIndex].id.replace('page', '');
      
      // Handle specific page reinitializations
      switch(pageNumber) {
        case '2':
          if (window.myChart) {
            window.myChart.update();
          }
          break;
        case '3':
          if (window.initializeFlappers) {
            window.initializeFlappers();
            window.fetchFlapperData();
          }
          break;
        case '5':
          // Update both chart and indicators
          if (window.hashrateChart) {
            window.hashrateChart.update();
          }
          if (window.updateHashrate) {
            window.updateHashrate();
          }
          break;
        case '6':
          // Reinitialize Svelte app
          const svelteElem = document.querySelector(".svelte-1onyhi4");
          if (svelteElem) {
            setTimeout(() => {
              svelteElem.classList.add("active");
            }, 150);
          }
          break;
        case '8':
          // Reinitialize map
          if (window.map) {
            window.map.invalidateSize();
          }
          break;
        case '10':
          // Reinitialize Fear & Greed gauge
          if (window.fearGreedGauge) {
            window.fearGreedGauge.reflow();
          }
          break;
        case '12':
          if (window.marketCapChart) {
            window.marketCapChart.update();
          }
          break;
        case '13':
          if (window.checkAndRenderTreemap) {
            window.checkAndRenderTreemap();
          }
          break;
        case '14':
          if (window.txChart) {
            window.txChart.update();
          }
          break;
        case '16':
          if (window.mayerMultipleChart) {
            window.mayerMultipleChart.update();
          }
          break;
      }
      
      // Trigger a resize event to help responsive elements adjust
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 200);
    };

    window.showPrevPage = function() {
      if (!pageElements.length) {
        if (originalShowPrevPage) originalShowPrevPage();
        return;
      }

      const currentPage = document.querySelector(".page.active");
      if (!currentPage) return;

      let currentIndex = Array.from(pageElements).indexOf(currentPage);
      
      do {
        currentIndex = (currentIndex - 1 + pageElements.length) % pageElements.length;
      } while (pageElements[currentIndex].classList.contains("hidden"));

      // Handle Svelte app visibility when navigating away from page 6 - MODIFIED PART
      if (currentPage.id === 'page6') {
        const svelteElem = document.querySelector(".svelte-1onyhi4");
        if (svelteElem) {
          svelteElem.classList.remove("active");
          svelteElem.style.display = 'none';  // Added this line for backwards navigation
          setTimeout(() => {
            svelteElem.style.display = '';  // Reset display after a delay
          }, 300);
        }
      }

      currentPage.classList.remove("active");
      pageElements[currentIndex].classList.add("active");
      window.updatePageHash(pageElements[currentIndex]);

      // Re-trigger page-specific initialization
      const pageNumber = pageElements[currentIndex].id.replace('page', '');
      
      // Handle specific page reinitializations
      switch(pageNumber) {
        case '2':
          if (window.myChart) {
            window.myChart.update();
          }
          break;
        case '3':
          if (window.initializeFlappers) {
            window.initializeFlappers();
            window.fetchFlapperData();
          }
          break;
        case '5':
          // Update both chart and indicators
          if (window.hashrateChart) {
            window.hashrateChart.update();
          }
          if (window.updateHashrate) {
            window.updateHashrate();
          }
          break;
        case '6':
          // Reinitialize Svelte app
          const svelteElem = document.querySelector(".svelte-1onyhi4");
          if (svelteElem) {
            setTimeout(() => {
              svelteElem.classList.add("active");
            }, 150);
          }
          break;
        case '8':
          // Reinitialize map
          if (window.map) {
            window.map.invalidateSize();
          }
          break;
        case '10':
          // Reinitialize Fear & Greed gauge
          if (window.fearGreedGauge) {
            window.fearGreedGauge.reflow();
          }
          break;
        case '12':
          if (window.marketCapChart) {
            window.marketCapChart.update();
          }
          break;
        case '13':
          if (window.checkAndRenderTreemap) {
            window.checkAndRenderTreemap();
          }
          break;
        case '14':
          if (window.txChart) {
            window.txChart.update();
          }
          break;
        case '16':
          if (window.mayerMultipleChart) {
            window.mayerMultipleChart.update();
          }
          break;
      }
      
      // Trigger a resize event to help responsive elements adjust
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 200);
    };
  }

  /**
   * Jump to first enabled page
   */
  function jumpToFirstEnabledPage() {
    const userPages = loadPreferences();
    const firstEnabled = userPages.find(page => page.enabled);
    
    if (firstEnabled) {
      const pages = document.querySelectorAll(".page");
      const firstPage = document.getElementById(firstEnabled.id);
      
      if (firstPage && !firstPage.classList.contains("hidden")) {
        pages.forEach(page => page.classList.remove("active"));
        firstPage.classList.add("active");
        window.updatePageHash(firstPage);
      }
    }
  }

  // Event Listeners
  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      settingsModal.style.display = "block";
      renderSettings();
    });
  }

  if (closeSettings) {
    closeSettings.addEventListener("click", (e) => {
      e.preventDefault();
      settingsModal.style.display = "none";
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const updatedPages = Array.from(pagesContainer.children).map(item => ({
        id: item.querySelector("img").alt,
        name: item.querySelector("span").textContent,
        img: item.querySelector("img").src,
        enabled: item.querySelector("input[type='checkbox']").checked,
        originalIndex: parseInt(item.dataset.originalIndex)
      }));

      savePreferences(updatedPages);
      settingsModal.style.display = "none";
      reorderPagesInDOM();
      jumpToFirstEnabledPage();
    });
  }

  // Initialize on page load only if we're on the dashboard
  if (document.querySelector(".page")) {
    reorderPagesInDOM();
  }
});