<?php
// update_walletdata.php

// Suppress warnings from malformed HTML
libxml_use_internal_errors(true);

// Function to fetch data using cURL
function fetchData($url) {
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    // Set user agent to mimic a browser request
    curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0');
    // Set timeout
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    // Handle HTTPS sites
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($curl);
    if ($response === false) {
        echo 'cURL error: ' . curl_error($curl);
        curl_close($curl);
        return false;
    }
    curl_close($curl);
    return $response;
}

// Function to fetch and process wallet data
function fetchWalletData() {
    $proxyUrl = 'https://api.allorigins.win/get?url=';
    $targetUrl = 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html';

    $encodedUrl = urlencode($targetUrl);
    $url = $proxyUrl . $encodedUrl;

    // Fetch the data via AllOrigins
    $jsonResponse = fetchData($url);
    if ($jsonResponse === false) {
        echo "Failed to fetch data from AllOrigins.";
        return false;
    }

    // Decode the JSON response
    $data = json_decode($jsonResponse, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "Failed to decode JSON response.";
        return false;
    }

    // Extract the contents (HTML)
    if (!isset($data['contents'])) {
        echo "No 'contents' field in response.";
        return false;
    }

    $html = $data['contents'];

    // Parse the HTML content
    $dom = new DOMDocument();
    if (!$dom->loadHTML($html)) {
        echo "Failed to parse HTML content.";
        return false;
    }

    $xpath = new DOMXPath($dom);

    // Query to find the data table
    $tableRows = $xpath->query('//table[contains(@class, "table-condensed") and contains(@class, "bb")]/tbody/tr');

    if ($tableRows->length == 0) {
        echo "Failed to find the data table.";
        return false;
    }

    $data = array();

    foreach ($tableRows as $row) {
        $cells = $row->getElementsByTagName('td');

        if ($cells->length < 2) {
            continue;
        }

        $balanceText = $cells->item(0)->textContent;
        $numberOfAddressesText = $cells->item(1)->textContent;

        // Extract balance ranges
        $balanceText = trim($balanceText);
        $balanceText = str_replace(['[', ']'], '', $balanceText);
        $balanceRanges = explode('-', $balanceText);
        $minBalance = floatval(str_replace(',', '', trim($balanceRanges[0])));
        $maxBalance = isset($balanceRanges[1]) ? floatval(str_replace(',', '', trim($balanceRanges[1]))) : $minBalance;

        // Skip specific shrimp balance ranges
        if (
            ($minBalance == 0 && $maxBalance == 0.00001) ||
            ($minBalance == 0.00001 && $maxBalance == 0.0001) ||
            ($minBalance == 0.0001 && $maxBalance == 0.001) ||
            ($minBalance == 0.001 && $maxBalance == 0.01) ||
            ($minBalance == 0.01 && $maxBalance == 0.1)
        ) {
            continue; // Skip this row
        }

        // Determine wallet type
        if ($minBalance >= 100000) {
            $walletType = '100k+';
        } elseif ($minBalance >= 10000) {
            $walletType = 'humpback';
        } elseif ($minBalance >= 1000) {
            $walletType = 'whale';
        } elseif ($minBalance >= 100) {
            $walletType = 'shark';
        } elseif ($minBalance >= 10) {
            $walletType = 'fish';
        } elseif ($minBalance >= 1) {
            $walletType = 'crab';
        } else {
            $walletType = 'shrimp';
        }

        $numberOfAddresses = intval(str_replace(',', '', $numberOfAddressesText));

        $data[$walletType] = $numberOfAddresses;
    }

    $walletData = array(
        'timestamp' => time() * 1000, // Current time in milliseconds
        'data' => $data
    );

    return $walletData;
}

// Main execution
$walletData = fetchWalletData();
if ($walletData !== false) {
    // Ensure the 'data' directory exists
    $dataDir = __DIR__;
    if (!file_exists($dataDir)) {
        mkdir($dataDir, 0755, true);
    }

    // Write to walletdata.json
    $jsonFilePath = $dataDir . '/walletdata.json';
    $jsonData = json_encode($walletData, JSON_PRETTY_PRINT);

    if (file_put_contents($jsonFilePath, $jsonData) !== false) {
        echo "walletdata.json updated successfully.";
    } else {
        echo "Failed to write to walletdata.json.";
    }
} else {
    echo "Failed to fetch wallet data.";
}
?>
