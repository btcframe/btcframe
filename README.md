# BTC Frame

BTCFrame is an open source and free Bitcoin dashboard to track Bitcoin related metrics in real-time. BTC Frame is a community-driven project, and we welcome developers of all skill levels to contribute. Your ideas and improvements can help make this project even better! Thank you for your contribution! Visit the live dashboard at https://btcframe.com

---

## Features

- **Live Bitcoin Metrics:** Display real-time Bitcoin price, market cap, block height, circulating supply, and more.
- **Advanced Charts:** Visualize historical Bitcoin prices and hash rates.
- **Fear and Greed Index:** Gauge market sentiment with interactive charts.
- **Halving Progress Tracking:** Stay updated on Bitcoin halving schedules and progress.
- **Node Map:** Visualize public Bitcoin nodes on an interactive map.
- **Multi-Currency Dashboard:** View Bitcoin prices in multiple currencies (USD, EUR, GBP, CAD, CHF and AUD) with real-time updates.
- **Hashrate Chart:** Explore network hash rate trends with detailed historical data.
- **SATs per Dollar Visualization:** Visual breakdown of SATs per dollar using grid-based visualizations.
- **Days Bitcoin Has Spent in Price Ranges:**  Shows how many days Bitcoin has traded within specific price ranges.
- **Mempool Visualizer:** Detailed representation of the Bitcoin mempool, highlighting transaction statistics and trends.
- **Address Distribution:** Analyze Bitcoin address distribution based on the BTC they hold.
- **Gold vs. Bitcoin Market Cap:** Compare Gold Market Cap to Bitcoin Market Cap on a dynamic chart.
- **Total Global Assets:** View total global assets with dynamic Bitcoin and Gold Market Caps on a tree map chart.
- **Daily Confirmed Transactions:** Track daily transaction trends and see how the network is evolving in real-time.
- **Bitcoin Wealth Distribution:** Wealth Distribution dashboard visualizes wallet addresses categorized by the value they hold in USD.
- **Mayer Multiple:**  Mayer Multiple compares Bitcoin to its 200-day SMA, revealing key insights into its long-term behavior.
- **US Median House Price in BTC:**  Ever wondered how many ₿ it takes to buy the median US house? Explore it live on this dashboard.
- **Polar Halving Spiral:**  Spiral chart showing Bitcoin price evolution relative to halving cycles.
- **Bitcoin Power Law Model:**  Shows Bitcoin price respecting a long-term power law trend.
- **Bitcoin Stock-to-Flow Model:**  Visualizes S2F model vs actual price.
- **Thank You, Satoshi:**  A visual tribute to Bitcoin’s anonymous creator in 21 languages.
- **Top Reachable Node Versions:**  Breakdown of which reachable Bitcoin node versions are live.
- **Seasonality (Monthly Returns):**  A matrix map showing Bitcoin’s monthly returns from 2013 to the current date.
- **Big Mac BTC Index:**  Tracks how many sats are needed to buy a Big Mac over time.
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
8. [MIT License](#mit-license)
9. [Contact](#contact)

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

---


## Data Providers

BTC Frame relies on various external APIs and data providers:

- [mempool.space API](https://mempool.space/) for block height and hash rate.
- [St. Louis Fed Web Services: FRED® API](https://fred.stlouisfed.org/docs/api/fred/) for US Median House Prices.
- [CryptoCompare API](https://min-api.cryptocompare.com/)) for historic Bitcoin metrics.
- [Bitfeed](https://bits.monospace.live/) for mempool visualizer.
- [Alternative.me API](https://alternative.me/) for the Fear and Greed Index.
- [Bitnodes API](https://bitnodes.io/) for public Bitcoin node data.
- [Flapper](https://github.com/flapper) for real-time value displays.

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

### Days Bitcoin Has Spent in Price Ranges
<img width="1792" alt="price-range" src="https://github.com/user-attachments/assets/8d6fdaf9-2cd8-41f5-b2f1-61e6670619c2" />

### Current Hashrate
![Current Hashrate](/screenshots/current-hashrate.png)

### Node Map
![Node Map](/screenshots/bitcoin-nodes.png)

### Wallet Distribution
![Wallet Distribution](/screenshots/wallet-distribution.png)

### Bitcoin vs. Gold Market Cap
![Bitcoin vs. Gold Market Cap](/screenshots/gold-vs-bitcoin.png)

### Total Global Assets
![Total Global Assets](/screenshots/total-global-assets.png)

### Daily Confirmed Transactions
![Daily Confirmed Transactions](/screenshots/tx-count.png)

### Bitcoin Wealth Distribution
![Bitcoin Wealth Distribution](/screenshots/wealth-distribution.png)

### Bitcoin Mayer Multiple
![Mayer Multiple](/screenshots/mayer-multiple.png)

### US Median House Price in BTC
![Mayer Multiple](/screenshots/house-price.png)

### Bitcoin Polar Graph
<img width="1792" alt="polar-graph" src="https://github.com/user-attachments/assets/99bcc3d8-5da7-41ca-9339-55a60a3a1ecc" />

### Bitcoin Power Law Model
<img width="1792" alt="power-law" src="https://github.com/user-attachments/assets/630bf5cc-a8a7-4920-9803-dcc91408cbc9" />

### Bitcoin Stock-to-Flow Model (S2F Model)
<img width="1792" alt="stock-to-flow-s2f" src="https://github.com/user-attachments/assets/29aabef6-b0e3-44e6-bfa9-1f925682f37a" />

### Thank You Satoshi
<img width="1792" alt="thank-you-satoshi" src="https://github.com/user-attachments/assets/8962a84d-ee25-4f8e-8b68-2ace0ffbad5a" />

### Bitcoin top Reachable Node Version
<img width="1792" alt="node-versions" src="https://github.com/user-attachments/assets/e16b637a-604a-4277-adda-196448fb904b" />

### Bitcoin Seasonality (Monthly Returns)
<img width="1792" alt="monthly-returns" src="https://github.com/user-attachments/assets/128ac726-2435-4a78-853a-5062954e723e" />

### Bitcoin Bi Mac Index
<img width="1792" alt="bigmac-index" src="https://github.com/user-attachments/assets/ede8c3f3-74e9-4b93-bb16-2f37c884ed66" />

---

## License

MIT License

Copyright (c) 2024 BTC Frame - Live Bitcoin Dashboard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Contact

If you have any questions about BTC Frame or are interested in contributing to the project, feel free to contact us at <a href="mailto:info@btcframe.com">info@btcframe.com</a>.

