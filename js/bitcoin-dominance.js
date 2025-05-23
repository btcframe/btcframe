// bitcoin-dominance.js
// Bitcoin Dominance Dashboard for Page 25

class BitcoinDominanceDashboard {
    constructor() {
        this.historicalData = {
            timestamps: [],
            bitcoinMarketCap: [],
            totalMarketCap: [],
            dominance: []
        };
        this.dominanceChart = null;
        this.bitcoinSparkline = null;
        this.marketSparkline = null;
        this.dominanceSparkline = null;
        this.updateInterval = null;
        this.isInitialized = false;
    }

    // Format numbers for display
    formatMarketCap(value) {
        if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
        if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
        if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
        return '$' + value.toLocaleString();
    }

    formatPercentage(value) {
        return value.toFixed(2) + '%';
    }

    // Load historical data from CryptoCompare
    async loadHistoricalData() {
        try {
            console.log('Loading Bitcoin dominance historical data...');
            
            // Get Bitcoin historical data
            const bitcoinResponse = await fetch('https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=90');
            const bitcoinData = await bitcoinResponse.json();
            
            // Get Ethereum historical data for better total market cap estimation
            const ethResponse = await fetch('https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=USD&limit=90');
            const ethData = await ethResponse.json();
            
            if (!bitcoinData.Data || !bitcoinData.Data.Data) {
                throw new Error('No Bitcoin historical data received');
            }
            
            // Clear existing data
            this.historicalData.timestamps.length = 0;
            this.historicalData.bitcoinMarketCap.length = 0;
            this.historicalData.totalMarketCap.length = 0;
            this.historicalData.dominance.length = 0;
            
            // Process historical data
            bitcoinData.Data.Data.forEach((btcDay, index) => {
                const timestamp = new Date(btcDay.time * 1000);
                const btcPrice = btcDay.close;
                
                // Approximate Bitcoin supply
                const btcSupply = 19700000;
                const bitcoinMC = btcPrice * btcSupply;
                
                // Get corresponding Ethereum data
                const ethDay = ethData.Data?.Data?.[index];
                let totalMC = bitcoinMC;
                
                if (ethDay) {
                    const ethPrice = ethDay.close;
                    const ethSupply = 120000000;
                    const ethMC = ethPrice * ethSupply;
                    
                    // Estimate total market cap (BTC + ETH typically ~65-70% of total market)
                    totalMC = (bitcoinMC + ethMC) / 0.68;
                } else {
                    // Fallback: estimate from Bitcoin alone
                    totalMC = bitcoinMC / 0.55;
                }
                
                const dominance = (bitcoinMC / totalMC) * 100;
                
                this.historicalData.timestamps.push(timestamp);
                this.historicalData.bitcoinMarketCap.push(bitcoinMC);
                this.historicalData.totalMarketCap.push(totalMC);
                this.historicalData.dominance.push(dominance);
            });
            
            console.log('Loaded', this.historicalData.timestamps.length, 'days of dominance data');
            
        } catch (error) {
            console.error('Failed to load historical data:', error);
            throw error;
        }
    }

    // Fetch current data from CoinGecko
    async fetchCurrentData() {
        try {
            console.log('Fetching current Bitcoin dominance data...');
            
            const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
            const globalData = await globalResponse.json();

            const bitcoinResponse = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false');
            const bitcoinData = await bitcoinResponse.json();

            const totalMarketCap = globalData.data.total_market_cap.usd;
            const bitcoinMarketCap = bitcoinData.market_data.market_cap.usd;
            const dominance = (bitcoinMarketCap / totalMarketCap) * 100;
            const now = new Date();

            // Update the most recent historical data point with current values
            if (this.historicalData.timestamps.length > 0) {
                const lastIndex = this.historicalData.timestamps.length - 1;
                const lastDate = this.historicalData.timestamps[lastIndex];
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const lastDateNormalized = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
                
                if (lastDateNormalized.getTime() === today.getTime()) {
                    // Update today's data
                    this.historicalData.bitcoinMarketCap[lastIndex] = bitcoinMarketCap;
                    this.historicalData.totalMarketCap[lastIndex] = totalMarketCap;
                    this.historicalData.dominance[lastIndex] = dominance;
                } else {
                    // Add new data point
                    this.historicalData.timestamps.push(now);
                    this.historicalData.bitcoinMarketCap.push(bitcoinMarketCap);
                    this.historicalData.totalMarketCap.push(totalMarketCap);
                    this.historicalData.dominance.push(dominance);
                }
            }

            this.updateDashboard({
                bitcoinMarketCap,
                totalMarketCap,
                dominance,
                bitcoinChange: bitcoinData.market_data.market_cap_change_percentage_24h || 0,
                marketChange: globalData.data.market_cap_change_percentage_24h_usd || 0,
                timestamp: now
            });

        } catch (error) {
            console.error('Error fetching current data:', error);
            // Don't throw error here to prevent breaking the dashboard
        }
    }

    // Update dashboard display
    updateDashboard(data) {
        // Update main values
        const btcCapElement = document.getElementById('bitcoin-market-cap');
        const totalCapElement = document.getElementById('total-market-cap');
        const dominanceElement = document.getElementById('dominance-value');
        
        if (btcCapElement) btcCapElement.textContent = this.formatMarketCap(data.bitcoinMarketCap);
        if (totalCapElement) totalCapElement.textContent = this.formatMarketCap(data.totalMarketCap);
        if (dominanceElement) dominanceElement.textContent = this.formatPercentage(data.dominance);

        // Update change indicators
        const btcChangeElement = document.getElementById('bitcoin-change');
        const marketChangeElement = document.getElementById('market-change');
        const dominanceChangeElement = document.getElementById('dominance-change');
        
        if (btcChangeElement) {
            btcChangeElement.textContent = data.bitcoinChange.toFixed(2) + '% (24h)';
            btcChangeElement.className = 'dominance-change' + (data.bitcoinChange < 0 ? ' negative' : '');
        }
        
        if (marketChangeElement) {
            marketChangeElement.textContent = data.marketChange.toFixed(2) + '% (24h)';
            marketChangeElement.className = 'dominance-change' + (data.marketChange < 0 ? ' negative' : '');
        }

        // Calculate dominance change
        const len = this.historicalData.dominance.length;
        if (len > 1) {
            const lastDominance = this.historicalData.dominance[len - 2];
            const dominanceChange = ((data.dominance / lastDominance) - 1) * 100;
            if (dominanceChangeElement) {
                dominanceChangeElement.textContent = dominanceChange.toFixed(2) + '% (24h)';
                dominanceChangeElement.className = 'dominance-change' + (dominanceChange < 0 ? ' negative' : '');
            }
        }

        // Update comparison bar
        const bitcoinBarElement = document.getElementById('bitcoin-bar');
        const dominancePercentageElement = document.getElementById('dominance-percentage');
        
        if (bitcoinBarElement) {
            bitcoinBarElement.style.width = data.dominance + '%';
        }
        
        if (dominancePercentageElement) {
            dominancePercentageElement.textContent = this.formatPercentage(data.dominance);
        }

        // Update chart and sparklines
        this.updateSparklines();
        this.updateDominanceChart();
    }

    // Create and update sparklines
    updateSparklines() {
        // Bitcoin sparkline
        const bitcoinCtx = document.getElementById('bitcoin-sparkline');
        if (bitcoinCtx) {
            if (!this.bitcoinSparkline) {
                this.bitcoinSparkline = new Chart(bitcoinCtx, {
                    type: 'line',
                    data: {
                        labels: this.historicalData.timestamps.map(d => d.toLocaleDateString()),
                        datasets: [{
                            data: this.historicalData.bitcoinMarketCap,
                            borderColor: '#f7931a',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            lineTension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: { display: false },
                        plugins: {
                            datalabels: false
                        },
                        tooltips: {
                            enabled: false
                        },
                        scales: { 
                            xAxes: [{ display: false }], 
                            yAxes: [{ display: false }] 
                        },
                        animation: { duration: 0 }
                    }
                });
            } else {
                this.bitcoinSparkline.data.labels = this.historicalData.timestamps.map(d => d.toLocaleDateString());
                this.bitcoinSparkline.data.datasets[0].data = this.historicalData.bitcoinMarketCap;
                this.bitcoinSparkline.update();
            }
        }

        // Total market sparkline
        const marketCtx = document.getElementById('market-sparkline');
        if (marketCtx) {
            if (!this.marketSparkline) {
                this.marketSparkline = new Chart(marketCtx, {
                    type: 'line',
                    data: {
                        labels: this.historicalData.timestamps.map(d => d.toLocaleDateString()),
                        datasets: [{
                            data: this.historicalData.totalMarketCap,
                            borderColor: '#3861fb',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            lineTension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: { display: false },
                        plugins: {
                            datalabels: false
                        },
                        tooltips: {
                            enabled: false
                        },
                        scales: { 
                            xAxes: [{ display: false }], 
                            yAxes: [{ display: false }] 
                        },
                        animation: { duration: 0 }
                    }
                });
            } else {
                this.marketSparkline.data.labels = this.historicalData.timestamps.map(d => d.toLocaleDateString());
                this.marketSparkline.data.datasets[0].data = this.historicalData.totalMarketCap;
                this.marketSparkline.update();
            }
        }

        // Dominance sparkline
        const dominanceCtx = document.getElementById('dominance-sparkline');
        if (dominanceCtx) {
            if (!this.dominanceSparkline) {
                this.dominanceSparkline = new Chart(dominanceCtx, {
                    type: 'line',
                    data: {
                        labels: this.historicalData.timestamps.map(d => d.toLocaleDateString()),
                        datasets: [{
                            data: this.historicalData.dominance,
                            borderColor: '#16c784',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: false,
                            lineTension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: { display: false },
                        plugins: {
                            datalabels: false
                        },
                        tooltips: {
                            enabled: false
                        },
                        scales: { 
                            xAxes: [{ display: false }], 
                            yAxes: [{ display: false }] 
                        },
                        animation: { duration: 0 }
                    }
                });
            } else {
                this.dominanceSparkline.data.labels = this.historicalData.timestamps.map(d => d.toLocaleDateString());
                this.dominanceSparkline.data.datasets[0].data = this.historicalData.dominance;
                this.dominanceSparkline.update();
            }
        }
    }

    // Create weekly labels from daily data
    getWeeklyLabels() {
        const weeklyLabels = [];
        const weeklyData = [];
        
        // Get every 7th data point for weekly display
        for (let i = 0; i < this.historicalData.timestamps.length; i += 7) {
            const date = this.historicalData.timestamps[i];
            const dominance = this.historicalData.dominance[i];
            
            // Format date as MM/DD
            const formattedDate = (date.getMonth() + 1) + '/' + date.getDate();
            weeklyLabels.push(formattedDate);
            weeklyData.push(dominance);
        }
        
        return { weeklyLabels, weeklyData };
    }

// Updated updateDominanceChart method for Chart.js 2.x
updateDominanceChart() {
    const ctx = document.getElementById('dominance-chart');
    if (!ctx) return;

    const { weeklyLabels, weeklyData } = this.getWeeklyLabels();

    if (!this.dominanceChart) {
        this.dominanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklyLabels,
                datasets: [{
                    label: 'Bitcoin Dominance',
                    data: weeklyData,
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 2,
                    pointRadius: 1,
                    pointBackgroundColor: '#f7931a',
                    fill: true,
                    lineTension: 0.4,
                    // Disable datalabels for this dataset
                    datalabels: {
                        display: false
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Chart.js 2.x uses 'legend' instead of 'plugins.legend'
                legend: { 
                    display: false  // Fix 2: Remove chart legend
                },
                // Chart.js 2.x: Disable datalabels plugin
                plugins: {
                    datalabels: {
                        display: false
                    }
                },
                // Alternative approach - disable at dataset level
                elements: {
                    point: {
                        radius: 1
                    }
                },
                // Chart.js 2.x uses 'tooltips' instead of 'plugins.tooltip'
                tooltips: {
                    mode: 'index', 
                    intersect: false,
                    backgroundColor: 'rgba(30, 30, 30, 0.9)',
                    titleFontColor: '#e0e0e0', 
                    bodyFontColor: '#e0e0e0',
                    borderColor: '#333', 
                    borderWidth: 1,
                    callbacks: {
                        label: (tooltipItem, data) => {
                            // Fix 3: Format tooltip to exactly 2 decimal places
                            return 'Dominance: ' + tooltipItem.yLabel.toFixed(2) + '%';
                        }
                    }
                },
                scales: {
                    // Chart.js 2.x uses different scale configuration
                    xAxes: [{
                        display: true,
                        gridLines: { 
                            color: "rgba(255, 255, 255, 0.15)",
                            lineWidth: 0.2
                        },
                        ticks: { 
                            fontColor: 'white',  // Fix 1: X-axis label font color to white
                            maxRotation: 0, 
                            autoSkip: false,
                            maxTicksLimit: weeklyLabels.length,
                            padding: 10
                        }
                    }],
                    yAxes: [{
                        display: true,
                        gridLines: { 
                            color: "rgba(255, 255, 255, 0.15)",
                            lineWidth: 0.2
                        },
                        ticks: {
                            fontColor: 'white',
                            padding: 10,
                            callback: (value) => value.toFixed(1) + '%'
                        }
                    }]
                },
                hover: { 
                    mode: 'nearest', 
                    axis: 'x', 
                    intersect: false 
                }
            }
        });
    } else {
        this.dominanceChart.data.labels = weeklyLabels;
        this.dominanceChart.data.datasets[0].data = weeklyData;
        this.dominanceChart.update();
    }
}

    // Show/hide loading indicator
    setLoading(isLoading) {
        const loadingElement = document.getElementById('dominance-loading');
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'block' : 'none';
        }
    }

    // Initialize the dashboard
    async init() {
        if (this.isInitialized) return;
        
        try {
            this.setLoading(true);
            
            // Load historical data first
            await this.loadHistoricalData();
            
            // Then fetch current data
            await this.fetchCurrentData();
            
            // Set up periodic updates (every 5 minutes)
            this.updateInterval = setInterval(() => {
                this.fetchCurrentData();
            }, 5 * 60 * 1000);
            
            this.isInitialized = true;
            console.log('Bitcoin Dominance dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Bitcoin Dominance dashboard:', error);
        } finally {
            this.setLoading(false);
        }
    }

    // Cleanup
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.dominanceChart) {
            this.dominanceChart.destroy();
            this.dominanceChart = null;
        }
        
        if (this.bitcoinSparkline) {
            this.bitcoinSparkline.destroy();
            this.bitcoinSparkline = null;
        }
        
        if (this.marketSparkline) {
            this.marketSparkline.destroy();
            this.marketSparkline = null;
        }
        
        if (this.dominanceSparkline) {
            this.dominanceSparkline.destroy();
            this.dominanceSparkline = null;
        }
        
        this.isInitialized = false;
    }
}

// Global instance
let dominanceDashboard = null;

// Initialize when page becomes active
function initDominanceDashboard() {
    if (!dominanceDashboard) {
        dominanceDashboard = new BitcoinDominanceDashboard();
    }
    dominanceDashboard.init();
}

// Check if we're on page 25 and initialize accordingly
function checkPage25() {
    const page25 = document.getElementById('page25');
    if (page25 && page25.classList.contains('active')) {
        initDominanceDashboard();
    }
}

// Listen for page changes if using your existing page navigation system
document.addEventListener('DOMContentLoaded', () => {
    // Initialize if page 25 is already active
    checkPage25();
    
    // Listen for page changes (you may need to integrate this with your existing page navigation)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                checkPage25();
            }
        });
    });
    
    const page25 = document.getElementById('page25');
    if (page25) {
        observer.observe(page25, { attributes: true });
    }
});

// Cleanup when page becomes inactive
window.addEventListener('beforeunload', () => {
    if (dominanceDashboard) {
        dominanceDashboard.cleanup();
    }
});