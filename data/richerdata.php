<?php
// update_richerdata.php

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

// Function to fetch and process richer data
function fetchRicherData() {
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

    // Find the correct table with caption 'Addresses richer than'
    $tables = $xpath->query('//table[caption[text()="Addresses richer than"]]');
    if ($tables->length == 0) {
        echo "Failed to find the 'Addresses richer than' table.";
        return false;
    }

    $table = $tables->item(0);
    $rows = $xpath->query('.//tr', $table);

    $data = array();

    foreach ($rows as $row) {
        $cells = $xpath->query('.//td', $row);
        if ($cells->length >= 2) {
            $balanceText = trim($cells->item(0)->textContent);
            $numberOfAddressesText = trim($cells->item(1)->textContent);

            // Extract balance value
            $balanceValue = str_replace(['$', ',', ' '], '', $balanceText);
            $balanceValue = floatval($balanceValue);

            // Store the number of addresses
            $numberOfAddresses = intval(str_replace(',', '', $numberOfAddressesText));

            // Map the balance to labels as per your HTML IDs
            // Adjust the balance thresholds and labels as needed
            if ($balanceValue >= 10000000) { // $10M
                $label = 'number6';
            } elseif ($balanceValue >= 1000000) { // $1M
                $label = 'number5';
            } elseif ($balanceValue >= 100000) { // $100K
                $label = 'number4';
            } elseif ($balanceValue >= 10000) { // $10K
                $label = 'number3';
            } elseif ($balanceValue >= 1000) { // $1K
                $label = 'number2';
            } elseif ($balanceValue >= 100) { // $100
                $label = 'number1';
            } else {
                continue; // Skip balances less than $100
            }

            $data[$label] = $numberOfAddresses;
        }
    }

    $richerData = array(
        'timestamp' => time() * 1000, // Current time in milliseconds
        'data' => $data
    );

    return $richerData;
}

// Main execution
$richerData = fetchRicherData();
if ($richerData !== false) {
    $dataDir = __DIR__;
    $jsonFilePath = $dataDir . '/richerdata.json';

    $dataArray = array();

    // Check if 'richerdata.json' exists
    if (file_exists($jsonFilePath)) {
        // Read existing data
        $existingData = file_get_contents($jsonFilePath);
        if ($existingData !== false) {
            $dataArray = json_decode($existingData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                echo "Failed to decode existing richerdata.json.";
                $dataArray = array(); // Reset to empty array on error
            }
        }
    }

    // Append the new data
    $dataArray[] = $richerData;

    // Remove data points older than 7 days (or any retention period you prefer)
    $retentionPeriod = 7 * 24 * 60 * 60; // 7 days in seconds
    $currentTime = time();
    $dataArray = array_filter($dataArray, function ($entry) use ($currentTime, $retentionPeriod) {
        return ($currentTime - ($entry['timestamp'] / 1000)) <= $retentionPeriod;
    });

    // Write the updated data to 'richerdata.json'
    $jsonData = json_encode(array_values($dataArray), JSON_PRETTY_PRINT);
    if (file_put_contents($jsonFilePath, $jsonData) !== false) {
        echo "richerdata.json updated successfully.";
    } else {
        echo "Failed to write to richerdata.json.";
    }
} else {
    echo "Failed to fetch richer data.";
}
?>
