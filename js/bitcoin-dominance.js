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
        
        this.CACHE_DURATION = 2 * 60 * 60 * 1000;
        this.CACHE_KEY_HISTORICAL = 'btc_dominance_historical_cache';
        this.CACHE_KEY_CURRENT = 'btc_dominance_current_cache';
    }

    getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const now = Date.now();
            
            if (now - data.timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(key);
                return null;
            }
            
            if (key === this.CACHE_KEY_HISTORICAL && data.value) {
                data.value.timestamps = data.value.timestamps.map(ts => new Date(ts));
            }
            
            return data.value;
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }

    saveToCache(key, value) {
        try {
            const data = {
                timestamp: Date.now(),
                value: value
            };
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }

    clearCache() {
        localStorage.removeItem(this.CACHE_KEY_HISTORICAL);
        localStorage.removeItem(this.CACHE_KEY_CURRENT);
    }

    formatMarketCap(value) {
        if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
        if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
        if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
        return '$' + value.toLocaleString();
    }

    formatPercentage(value) {
        return value.toFixed(2) + '%';
    }

    async loadHistoricalData(forceRefresh = false) {
        try {
            if (!forceRefresh) {
                const cachedData = this.getFromCache(this.CACHE_KEY_HISTORICAL);
                if (cachedData) {
                    console.log('Using cached historical data');
                    this.historicalData = cachedData;
                    return;
                }
            }
            
            console.log('Loading fresh Bitcoin dominance historical data...');
            
            const bitcoinResponse = await fetch('https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=90');
            const bitcoinData = await bitcoinResponse.json();
            
            const ethResponse = await fetch('https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=USD&limit=90');
            const ethData = await ethResponse.json();
            
            if (!bitcoinData.Data || !bitcoinData.Data.Data) {
                throw new Error('No Bitcoin historical data received');
            }
            
            this.historicalData.timestamps.length = 0;
            this.historicalData.bitcoinMarketCap.length = 0;
            this.historicalData.totalMarketCap.length = 0;
            this.historicalData.dominance.length = 0;
            
            bitcoinData.Data.Data.forEach((btcDay, index) => {
                const timestamp = new Date(btcDay.time * 1000);
                const btcPrice = btcDay.close;
                
                const btcSupply = 19700000;
                const bitcoinMC = btcPrice * btcSupply;
                
                const ethDay = ethData.Data?.Data?.[index];
                let totalMC = bitcoinMC;
                
                if (ethDay) {
                    const ethPrice = ethDay.close;
                    const ethSupply = 120000000;
                    const ethMC = ethPrice * ethSupply;
                    
                    totalMC = (bitcoinMC + ethMC) / 0.68;
                } else {
                    totalMC = bitcoinMC / 0.55;
                }
                
                const dominance = (bitcoinMC / totalMC) * 100;
                
                this.historicalData.timestamps.push(timestamp);
                this.historicalData.bitcoinMarketCap.push(bitcoinMC);
                this.historicalData.totalMarketCap.push(totalMC);
                this.historicalData.dominance.push(dominance);
            });
            
            console.log('Loaded', this.historicalData.timestamps.length, 'days of dominance data');
            
            this.saveToCache(this.CACHE_KEY_HISTORICAL, this.historicalData);
            
        } catch (error) {
            console.error('Failed to load historical data:', error);
            throw error;
        }
    }

    calculate24hChange(currentValue, dataArray) {
        if (dataArray.length < 2) return 0;
        
        const yesterday = dataArray[dataArray.length - 2];
        if (!yesterday || yesterday === 0) return 0;
        
        return ((currentValue - yesterday) / yesterday) * 100;
    }

    async fetchCurrentData(forceRefresh = false) {
        try {
            if (!forceRefresh) {
                const cachedData = this.getFromCache(this.CACHE_KEY_CURRENT);
                if (cachedData) {
                    console.log('Using cached current data');
                    this.updateDashboard(cachedData);
                    return;
                }
            }
            
            console.log('Fetching fresh Bitcoin dominance data...');
            
            const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
            const globalData = await globalResponse.json();

            const bitcoinResponse = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false');
            const bitcoinData = await bitcoinResponse.json();

            const totalMarketCap = globalData.data.total_market_cap.usd;
            const bitcoinMarketCap = bitcoinData.market_data.market_cap.usd;
            const dominance = (bitcoinMarketCap / totalMarketCap) * 100;
            const now = new Date();

            const bitcoinChange = this.calculate24hChange(bitcoinMarketCap, this.historicalData.bitcoinMarketCap);
            const marketChange = this.calculate24hChange(totalMarketCap, this.historicalData.totalMarketCap);
            const dominanceChange = this.calculate24hChange(dominance, this.historicalData.dominance);

            if (this.historicalData.timestamps.length > 0) {
                const lastIndex = this.historicalData.timestamps.length - 1;
                const lastDate = this.historicalData.timestamps[lastIndex];
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const lastDateNormalized = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
                
                if (lastDateNormalized.getTime() === today.getTime()) {
                    this.historicalData.bitcoinMarketCap[lastIndex] = bitcoinMarketCap;
                    this.historicalData.totalMarketCap[lastIndex] = totalMarketCap;
                    this.historicalData.dominance[lastIndex] = dominance;
                } else {
                    this.historicalData.timestamps.push(today);
                    this.historicalData.bitcoinMarketCap.push(bitcoinMarketCap);
                    this.historicalData.totalMarketCap.push(totalMarketCap);
                    this.historicalData.dominance.push(dominance);
                    
                    if (this.historicalData.timestamps.length > 91) {
                        this.historicalData.timestamps.shift();
                        this.historicalData.bitcoinMarketCap.shift();
                        this.historicalData.totalMarketCap.shift();
                        this.historicalData.dominance.shift();
                    }
                }
            }

            const currentData = {
                bitcoinMarketCap,
                totalMarketCap,
                dominance,
                bitcoinChange,
                marketChange,
                dominanceChange,
                timestamp: now
            };

            this.saveToCache(this.CACHE_KEY_CURRENT, currentData);
            
            this.updateDashboard(currentData);

        } catch (error) {
            console.error('Error fetching current data:', error);
        }
    }

    async forceRefreshData() {
        console.log('Force refreshing all data...');
        this.setLoading(true);
        
        try {
            this.clearCache();
            
            await this.loadHistoricalData(true);
            
            await this.fetchCurrentData(true);
            
            console.log('Force refresh completed');
        } catch (error) {
            console.error('Error during force refresh:', error);
        } finally {
            this.setLoading(false);
        }
    }

    updateDashboard(data) {
        const btcCapElement = document.getElementById('bitcoin-market-cap');
        const totalCapElement = document.getElementById('total-market-cap');
        const dominanceElement = document.getElementById('dominance-value');
        
        if (btcCapElement) btcCapElement.textContent = this.formatMarketCap(data.bitcoinMarketCap);
        if (totalCapElement) totalCapElement.textContent = this.formatMarketCap(data.totalMarketCap);
        if (dominanceElement) dominanceElement.textContent = this.formatPercentage(data.dominance);

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

        if (dominanceChangeElement) {
            dominanceChangeElement.textContent = data.dominanceChange.toFixed(2) + '% (24h)';
            dominanceChangeElement.className = 'dominance-change' + (data.dominanceChange < 0 ? ' negative' : '');
        }

        const bitcoinBarElement = document.getElementById('bitcoin-bar');
        const dominancePercentageElement = document.getElementById('dominance-percentage');
        
        if (bitcoinBarElement) {
            bitcoinBarElement.style.width = data.dominance + '%';
        }
        
        if (dominancePercentageElement) {
            dominancePercentageElement.textContent = this.formatPercentage(data.dominance);
        }

        this.updateSparklines();
        this.updateDominanceChart();
    }

    updateSparklines() {
        const bitcoinCtx = document.getElementById('bitcoin-sparkline');
        if (bitcoinCtx) {
            if (!this.bitcoinSparkline || this.bitcoinSparkline.canvas === null) {
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

        const marketCtx = document.getElementById('market-sparkline');
        if (marketCtx) {
            if (!this.marketSparkline || this.marketSparkline.canvas === null) {
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

        const dominanceCtx = document.getElementById('dominance-sparkline');
        if (dominanceCtx) {
            if (!this.dominanceSparkline || this.dominanceSparkline.canvas === null) {
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

    getWeeklyLabels() {
        const weeklyLabels = [];
        const weeklyData = [];
        
        for (let i = 0; i < this.historicalData.timestamps.length; i += 7) {
            const date = this.historicalData.timestamps[i];
            const dominance = this.historicalData.dominance[i];
            
            const formattedDate = (date.getMonth() + 1) + '/' + date.getDate();
            weeklyLabels.push(formattedDate);
            weeklyData.push(dominance);
        }
        
        const lastIndex = this.historicalData.timestamps.length - 1;
        if (lastIndex % 7 !== 0 && lastIndex >= 0) {
            const lastDate = this.historicalData.timestamps[lastIndex];
            const lastDominance = this.historicalData.dominance[lastIndex];
            const formattedDate = (lastDate.getMonth() + 1) + '/' + lastDate.getDate();
            weeklyLabels.push(formattedDate);
            weeklyData.push(lastDominance);
        }
        
        return { weeklyLabels, weeklyData };
    }

    updateDominanceChart() {
        const ctx = document.getElementById('dominance-chart');
        if (!ctx) return;

        const { weeklyLabels, weeklyData } = this.getWeeklyLabels();

        if (!this.dominanceChart || this.dominanceChart.canvas === null) {
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
                        datalabels: {
                            display: false
                        }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    legend: { 
                        display: false
                    },
                    plugins: {
                        datalabels: {
                            display: false
                        }
                    },
                    elements: {
                        point: {
                            radius: 1
                        }
                    },
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
                                return 'Dominance: ' + tooltipItem.yLabel.toFixed(2) + '%';
                            }
                        }
                    },
                    scales: {
                        xAxes: [{
                            display: true,
                            gridLines: { 
                                color: "rgba(255, 255, 255, 0.15)",
                                lineWidth: 0.2
                            },
                            ticks: { 
                                fontColor: 'white',
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

    setLoading(isLoading) {
        const loadingElement = document.getElementById('dominance-loading');
        if (loadingElement) {
            loadingElement.style.display = isLoading ? 'block' : 'none';
        }
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            this.setLoading(true);
            
            await this.loadHistoricalData();
            
            await this.fetchCurrentData();
            
            this.updateInterval = setInterval(() => {
                this.fetchCurrentData();
            }, 5 * 60 * 1000);
            
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const msUntilMidnight = tomorrow - now;
            
            setTimeout(() => {
                this.forceRefreshData();
                setInterval(() => {
                    this.forceRefreshData();
                }, 24 * 60 * 60 * 1000);
            }, msUntilMidnight);
            
            this.isInitialized = true;
            console.log('Bitcoin Dominance dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Bitcoin Dominance dashboard:', error);
        } finally {
            this.setLoading(false);
        }
    }

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

let dominanceDashboard = null;

function initDominanceDashboard() {
    if (!dominanceDashboard) {
        dominanceDashboard = new BitcoinDominanceDashboard();
    }
    dominanceDashboard.init();
}

function checkPage25() {
    const page25 = document.getElementById('page25');
    if (page25 && page25.classList.contains('active')) {
        initDominanceDashboard();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkPage25();
    
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

window.addEventListener('beforeunload', () => {
    if (dominanceDashboard) {
        dominanceDashboard.cleanup();
    }
});

window.BitcoinDominanceDashboard = BitcoinDominanceDashboard;
window.dominanceDashboard = dominanceDashboard;