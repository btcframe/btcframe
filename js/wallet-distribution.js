// wallet-distribution.js

(function () {
  // Wait for the DOM to be fully loaded before running the script
  document.addEventListener("DOMContentLoaded", async () => {
    // Cache settings (using new key names)
    const CACHE_KEY = "walletDistributionData";
    const CACHE_TIMESTAMP_KEY = "walletDistributionDataTimestamp";
    const CACHE_EXPIRATION_TIME = 20 * 60 * 1000; // 20 minutes

    // Direct data URL (no proxy or ngrok required)
    const dataUrl = "https://address-distribution.btcframe.com/proxy";

    // Function to format large numbers with commas and decimals
    function formatNumber(value, decimals = 2) {
      return value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    // Function to clean BTC Balance column (remove square brackets)
    function cleanBalanceRange(balance) {
      return balance.replace(/\[|\)|\]/g, ""); // Remove [ and )
    }

    // Check cache and return parsed data if still valid
    function checkCache() {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (cachedData && cachedTimestamp) {
        const currentTime = new Date().getTime();
        if (currentTime - parseInt(cachedTimestamp, 10) < CACHE_EXPIRATION_TIME) {
          console.log("Using cached data");
          return JSON.parse(cachedData);
        } else {
          console.log("Cache expired, fetching new data");
          localStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
      }
      return null;
    }

    // Store fetched data in cache
    function storeInCache(data) {
      const currentTime = new Date().getTime();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, currentTime.toString());
    }

    // Determine wallet type based on minimum balance
    function determineWalletType(minBalance) {
      if (minBalance >= 100000)
        return { icon: "💯", walletType: "100k+", walletTypeClass: "wallet-100k" };
      if (minBalance >= 10000)
        return { icon: "🐋", walletType: "humpback", walletTypeClass: "wallet-humpback" };
      if (minBalance >= 1000)
        return { icon: "🐳", walletType: "whale", walletTypeClass: "wallet-whale" };
      if (minBalance >= 100)
        return { icon: "🦈", walletType: "shark", walletTypeClass: "wallet-shark" };
      if (minBalance >= 10)
        return { icon: "🐟", walletType: "fish", walletTypeClass: "wallet-fish" };
      if (minBalance >= 1)
        return { icon: "🦀", walletType: "crab", walletTypeClass: "wallet-crab" };
      if (minBalance >= 0.1)
        return { icon: "🦐", walletType: "shrimp", walletTypeClass: "wallet-shrimp" };
      return null; // All below 0.1 BTC will be combined into PLANKTON
    }

    // Fetch and process data using fetch and async/await
    async function fetchData() {
      try {
        const response = await fetch(dataUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Use the table with classes "table-condensed" and "bb"
        const table = doc.querySelector(".table-condensed.bb");
        if (!table) {
          console.error("Table not found in fetched data.");
          return null;
        }

        const rows = table.querySelectorAll("tbody tr");
        let currentData = [];

        // Initialize PLANKTON category (for all balances below 0.1 BTC)
        let plankton = {
          walletType: "plankton",
          walletTypeClass: "wallet-plankton",
          icon: "🐛",
          btcBalance: "< 0.1 BTC",
          numberOfAddresses: 0,
          totalBTC: 0,
          btcPercent: ""
        };

        let grandTotalBTC = 0;

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (!cells || cells.length < 6) return;

          const balanceText = cells[0].textContent.match(/[\d,.]+/g);
          if (!balanceText) return;

          const minBalance = parseFloat(balanceText[0].replace(/,/g, ""));
          const maxBalance = balanceText[1]
            ? parseFloat(balanceText[1].replace(/,/g, ""))
            : minBalance;

          // If balance is below 0.1 BTC, add to PLANKTON
          if (maxBalance < 0.1 || minBalance < 0.1) {
            plankton.numberOfAddresses += parseInt(cells[1].textContent.replace(/,/g, ""), 10);
            plankton.totalBTC += parseFloat(cells[3].textContent.replace(/,/g, ""));
          } else {
            const walletTypeClass = determineWalletType(minBalance);
            if (walletTypeClass) {
              const totalBTC = parseFloat(cells[3].textContent.replace(/,/g, ""));
              grandTotalBTC += totalBTC;
              currentData.push({
                walletType: walletTypeClass.walletType,
                walletTypeClass: walletTypeClass.walletTypeClass,
                icon: walletTypeClass.icon,
                btcBalance: cleanBalanceRange(cells[0].textContent.trim()),
                numberOfAddresses: parseInt(cells[1].textContent.replace(/,/g, ""), 10),
                totalBTC: formatNumber(totalBTC),
                btcPercent: cells[5].textContent.trim()
              });
            }
          }
        });

        // Finalize PLANKTON values
        grandTotalBTC += plankton.totalBTC; // Include PLANKTON in grand total
        const rawPlanktonTotal = plankton.totalBTC;
        plankton.btcPercent = ((rawPlanktonTotal / grandTotalBTC) * 100).toFixed(2) + "% (100%)";
        plankton.totalBTC = formatNumber(rawPlanktonTotal);

        // Add PLANKTON as the first element in the data array
        currentData.unshift(plankton);

        storeInCache(currentData);
        return currentData;
      } catch (error) {
        console.error("Error fetching data:", error);
        return null;
      }
    }

    // Update the UI by injecting rows into the table
    function updateUI(currentData) {
      const tableBody = document.querySelector("#bitcoin-distribution-table tbody");
      if (!tableBody) {
        console.error("Table body not found");
        return;
      }
      tableBody.innerHTML = "";
      const fragment = document.createDocumentFragment();

      currentData.forEach((item) => {
        const newRow = document.createElement("tr");
        newRow.classList.add(item.walletTypeClass);

        const walletTypeCell = document.createElement("td");
        walletTypeCell.innerHTML = `<div class="wallet-type-container ${item.walletTypeClass}">
            <span class="wallet-icon">${item.icon}</span>
            <span class="wallet-type">${item.walletType}</span>
        </div>`;
        newRow.appendChild(walletTypeCell);

        const btcBalanceCell = document.createElement("td");
        btcBalanceCell.textContent = item.btcBalance;
        newRow.appendChild(btcBalanceCell);

        const addressesCell = document.createElement("td");
        addressesCell.textContent = (item.numberOfAddresses || 0).toLocaleString();
        newRow.appendChild(addressesCell);

        const totalBTCCell = document.createElement("td");
        totalBTCCell.textContent = item.totalBTC;
        newRow.appendChild(totalBTCCell);

        const btcPercentCell = document.createElement("td");
        btcPercentCell.textContent = item.btcPercent;
        newRow.appendChild(btcPercentCell);

        fragment.appendChild(newRow);
      });

      tableBody.appendChild(fragment);
    }

    // Main logic: Check cache; if valid, update UI; otherwise, fetch new data.
    let cachedData = checkCache();
    if (cachedData) {
      updateUI(cachedData);
      const bitcoinTable = document.getElementById("bitcoin-distribution-table");
      if (bitcoinTable) bitcoinTable.style.display = "table";
    } else {
      const data = await fetchData();
      if (data) {
        updateUI(data);
        const bitcoinTable = document.getElementById("bitcoin-distribution-table");
        if (bitcoinTable) bitcoinTable.style.display = "table";
      }
    }
  });
})();
