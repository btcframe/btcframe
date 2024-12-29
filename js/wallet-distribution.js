// wallet-distribution.js

// Declare loadingElement at the top level
var loadingElement;

(function () {
    // Ensure the DOM is fully loaded before running the script
    function domReady(callback) {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    domReady(function () {
        loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }

        var proxyUrl = 'https://api.allorigins.win/raw?url=';
        var targetUrl = 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html';

        // Skip unnecessary ranges
        function shouldSkipRange(minBalance, maxBalance) {
            const skipRanges = [
                { min: 0, max: 0.00001 },
                { min: 0.00001, max: 0.0001 },
                { min: 0.0001, max: 0.001 },
                { min: 0.001, max: 0.01 },
                { min: 0.01, max: 0.1 },
            ];
            return skipRanges.some(range => minBalance === range.min && maxBalance === range.max);
        }

        // Determine wallet type
        function determineWalletType(minBalance) {
            if (minBalance >= 100000) return { icon: '💯', walletType: '100k+', walletTypeClass: 'wallet-100k' };
            if (minBalance >= 10000) return { icon: '🐋', walletType: 'humpback', walletTypeClass: 'wallet-humpback' };
            if (minBalance >= 1000) return { icon: '🐳', walletType: 'whale', walletTypeClass: 'wallet-whale' };
            if (minBalance >= 100) return { icon: '🦈', walletType: 'shark', walletTypeClass: 'wallet-shark' };
            if (minBalance >= 10) return { icon: '🐟', walletType: 'fish', walletTypeClass: 'wallet-fish' };
            if (minBalance >= 1) return { icon: '🦀', walletType: 'crab', walletTypeClass: 'wallet-crab' };
            return { icon: '🦐', walletType: 'shrimp', walletTypeClass: 'wallet-shrimp' };
        }

        // Fetch and process data
        function fetchData() {
            var url = proxyUrl + encodeURIComponent(targetUrl);
            var request = new XMLHttpRequest();
            request.open('GET', url, true);

            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    if (request.status >= 200 && request.status < 400) {
                        try {
                            var parser = new DOMParser();
                            var doc = parser.parseFromString(request.responseText, 'text/html');
                            var table = doc.querySelector('.table-condensed.bb');

                            if (!table) {
                                console.error('Table not found in fetched data.');
                                loadingElement.innerText = 'Table not found. Please refresh.';
                                return;
                            }

                            var rows = table.querySelectorAll('tbody tr');
                            var currentData = [];

                            rows.forEach(row => {
                                var cells = row.querySelectorAll('td');
                                if (!cells || cells.length < 6) return;

                                var balanceText = cells[0].textContent.match(/[\d,.]+/g);
                                if (!balanceText) return;

                                var minBalance = parseFloat(balanceText[0].replace(/,/g, ''));
                                var maxBalance = balanceText[1] ? parseFloat(balanceText[1].replace(/,/g, '')) : minBalance;

                                if (shouldSkipRange(minBalance, maxBalance)) return;

                                var walletTypeClass = determineWalletType(minBalance);
                                currentData.push({
                                    walletType: walletTypeClass.walletType,
                                    walletTypeClass: walletTypeClass.walletTypeClass,
                                    icon: walletTypeClass.icon,
                                    btcBalance: cells[0].textContent.trim(),
                                    numberOfAddresses: parseInt(cells[1].textContent.replace(/,/g, ''), 10),
                                    totalBTC: cells[3].textContent.trim(),
                                    btcPercent: cells[5].textContent.trim()
                                });
                            });

                            updateUI(currentData);

                            loadingElement.style.display = 'none';
                            var bitcoinTable = document.getElementById('bitcoin-distribution-table');
                            if (bitcoinTable) {
                                bitcoinTable.style.display = 'table';
                            }
                        } catch (e) {
                            console.error('Error parsing fetched HTML:', e);
                            loadingElement.innerText = 'Error loading data. Please refresh.';
                        }
                    } else {
                        console.error('Failed to fetch data. HTTP Status:', request.status);
                        loadingElement.innerText = 'Failed to fetch data. Please refresh.';
                    }

                    loadingElement.style.display = 'none';
                }
            };

            request.onerror = function () {
                console.error('Request error.');
                loadingElement.innerText = 'Network error. Please try again.';
                loadingElement.style.display = 'none';
            };

            request.send();
        }

        function updateUI(currentData) {
            var tableBody = document.querySelector('#bitcoin-distribution-table tbody');
            tableBody.innerHTML = '';

            var fragment = document.createDocumentFragment();

            for (var i = 0; i < currentData.length; i++) {
                var item = currentData[i];

                var newRow = document.createElement('tr');
                newRow.className += ' ' + item.walletTypeClass;

                var walletTypeCell = document.createElement('td');
                walletTypeCell.innerHTML = `<div class="wallet-type-container ${item.walletTypeClass}">
                    <span class="wallet-icon">${item.icon}</span>
                    <span class="wallet-type">${item.walletType}</span>
                </div>`;
                newRow.appendChild(walletTypeCell);

                var btcBalanceCell = document.createElement('td');
                btcBalanceCell.textContent = item.btcBalance.replace('[', '').replace(')', '');
                newRow.appendChild(btcBalanceCell);

                var addressesCell = document.createElement('td');
                addressesCell.textContent = item.numberOfAddresses.toLocaleString();
                newRow.appendChild(addressesCell);

                var totalBTCCell = document.createElement('td');
                totalBTCCell.textContent = item.totalBTC;
                newRow.appendChild(totalBTCCell);

                var btcPercentCell = document.createElement('td');
                btcPercentCell.textContent = item.btcPercent;
                newRow.appendChild(btcPercentCell);

                fragment.appendChild(newRow);
            }

            tableBody.appendChild(fragment);
        }

        fetchData();
    });
})();
