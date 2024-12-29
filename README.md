# BTC Frame

BTCFrame is an open source and free Bitcoin dashboard to track Bitcoin related metrics in real-time. Feel free to 

---

## Features

- **Live Bitcoin Metrics:** Display real-time Bitcoin price, market cap, block height, circulating supply, and more.
- **Advanced Charts:** Visualize historical Bitcoin prices and hash rates.
- **Fear and Greed Index:** Gauge market sentiment with interactive charts.
- **Halving Progress Tracking:** Stay updated on Bitcoin halving schedules and progress.
- **Node Map:** Visualize public Bitcoin nodes on an interactive map.
- **Multi-Currency Prices Dashboard:** View Bitcoin prices in multiple currencies (USD, EUR, GBP, CAD, CHF) with real-time updates.
- **Hashrate Chart:** Explore network hash rate trends with detailed historical data.
- **SATs per Dollar Visualization:** Visual breakdown of SATs per dollar using grid-based visualizations.
- **Bitcoin Clock:** A custom Bitcoin-themed clock with "Tick Tock Next Block" branding.
- **Mempool Visualizer:** Detailed representation of the Bitcoin mempool, highlighting transaction statistics and trends.
- **Wallet Distribution Chart:** Analyze Bitcoin wallet balance distributions and 24-hour changes.
- **DIY Customization:** Build, assemble, and configure the smart frame yourself.

---

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [DIY Assembly](#diy-assembly)
4. [Dashboard Overview](#dashboard-overview)
5. [Data Providers](#data-providers)
6. [Screenshots](#screenshots)
7. [Contributing](#contributing)
8. [License](#license)

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/username/btc-frame.git
   cd btc-frame
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm start
   ```

4. Build for production:

   ```bash
   npm run build
   ```

5. Open `index.html` in your browser to view the dashboard.

---

## Usage

1. Navigate through multiple dashboard pages using the arrow buttons.
2. Toggle fullscreen mode by clicking the fullscreen button.
3. Pause or resume auto-rotation between pages.
4. Access advanced metrics like block height, hash rate, market cap, and SATs per dollar.

---

## DIY Assembly

BTC Frame is designed as a DIY project. Here's a basic guide to building your frame:

1. **Hardware Requirements:**
   - Raspberry Pi (or equivalent)
   - Digital photo frame or LCD display
   - Power supply and case for the Raspberry Pi

2. **Software Setup:**
   - Install Raspbian OS on the Raspberry Pi.
   - Clone the BTC Frame repository onto the Raspberry Pi.
   - Set up a browser to launch the dashboard on startup.

3. **Configuration:**
   - Configure the environment variables for API keys and settings in `env.js`.

4. **Final Assembly:**
   - Install the LCD display and Raspberry Pi into the frame.
   - Connect the components and test the setup.

For detailed DIY assembly instructions, refer to the [DIY Guide](DIY.md).

---

## Dashboard Overview

BTC Frame includes 11 interactive dashboards, each displaying unique Bitcoin metrics and data:

1. **Page 1: Overview**
   - Displays live Bitcoin price in USD.
   - SATs per Dollar.
   - Average transaction fee in SAT/vB.
   - Current block height.
   - Network hash rate and difficulty.
   - Circulating supply and market cap.

2. **Page 2: Price History**
   - A dynamic line chart showing historical Bitcoin prices over time.
   - Includes 24-hour price change and percentage change.

3. **Page 3: Multi-Currency Prices**
   - Displays real-time Bitcoin prices in various currencies: USD, EUR, GBP, CAD, CHF.
   - Visual indicators for price changes.

4. **Page 4: Halving Progress**
   - Tracks Bitcoin halving events and their progress.
   - Displays the percentage of blocks completed in the current halving cycle.
   - Projects the date for the next halving.

5. **Page 5: Hash Rate**
   - Visualizes Bitcoin's network hash rate using an interactive line chart.
   - Includes historical and real-time hash rate data.

6. **Page 6: Mempool Visualizer**
   - Detailed representation of the Bitcoin mempool.
   - Highlights transaction statistics, fees, sizes, and confirmation times.

7. **Page 7: Bitcoin Clock**
   - A stylized clock with a Bitcoin theme.
   - Displays "Tick Tock Next Block" branding.

8. **Page 8: Node Map**
   - Interactive map showing reachable public Bitcoin nodes.
   - Displays the total number of nodes in the network.

9. **Page 9: SATs per Dollar Visualization**
   - Breaks down SATs per dollar into visual components.
   - Uses grids and visual elements to showcase micro values.

10. **Page 10: Fear and Greed Index**
    - Displays the market's fear and greed index.
    - Includes historical data for 7-day and 30-day trends.

11. **Page 11: Wallet Distribution Chart**
    - Displays wallet balance distributions in the Bitcoin network.
    - Includes address counts, BTC balances, and 24-hour changes.

---

## Data Providers

BTC Frame relies on various external APIs and data providers:

- [Bitnodes](https://bitnodes.io/) for public Bitcoin node data.
- [CoinGecko API](https://www.coingecko.com/en/api) for Bitcoin prices and market data.
- [mempool.space API](https://mempool.space/) for block height and hash rate.
- [BitInfoCharts](https://bitinfocharts.com/) for wallet distribution data.
- [Alternative.me](https://alternative.me/) for the Fear and Greed Index.
- [Flapper](https://github.com/flapper) for real-time value displays.
- [thooClock](https://github.com/thooClock) for the animated Bitcoin clock.

---

## Contributing

BTC Frame is a community-driven project, and we welcome developers of all skill levels to contribute. Your ideas and improvements can help make this project even better!

### How You Can Contribute
1. **Report Issues:**  
   Found a bug or have a feature request? Open an [issue](https://github.com/btcframe/btc-frame/issues) and share your feedback.

2. **Submit Pull Requests:**  
   - Fork the repository.  
   - Create a feature branch:  
     ```bash
     git checkout -b feature-name
     ```
   - Commit your changes with clear messages:  
     ```bash
     git commit -m "Description of the change"
     ```
   - Push your changes to your fork:  
     ```bash
     git push origin feature-name
     ```
   - Open a pull request against the `main` branch of the repository.

3. **Improve Documentation:**  
   Found missing or unclear information? Feel free to enhance the documentation.

4. **Suggest Enhancements:**  
   Have ideas for new dashboards, metrics, or visualizations? We'd love to hear your suggestions.

### Guidelines
- Ensure your contributions follow the project's coding standards.
- Write clear and concise commit messages.
- Include tests where applicable.
- Be respectful and collaborative in your discussions.

Thank you for helping BTC Frame grow and evolve! Together, we can build an incredible Bitcoin dashboard for everyone. 🚀


## Screenshots

### Dashboard Overview
![Main Dashboard](/screenshots/main-dashboard.png)

### Live Bitcoin Price
![Live Bitcoin Price](/screenshots/live-bitcoin-price.png)

### SATs Per Dollar
![SATs Per Dollar](/screenshots/sats-per-dollar.png)

### Bitcoin Live Chart
![Bitcoin Live Chart](/screenshots/bitcoin-live-chart.png)

### Mempool Visualizer
![Mempool Visualizer](/screenshots/mempool-visualizer.png)

### Fear and Greed Index
![Fear and Greed Index](/screenshots/fear-greed.png)

### Next Halving Progress
![Next Halving Progress](/screenshots/next-halving.png)

### Bitcoin Clock
![Bitcoin Clock](/screenshots/bitcoin-clock.png)

### Current Hashrate
![Current Hashrate](/screenshots/current-hashrate.png)

### Node Map
![Node Map](/screenshots/bitcoin-nodes.png)

### Wallet Distribution
![Wallet Distribution](/screenshots/wallet-distribution.png)

---
