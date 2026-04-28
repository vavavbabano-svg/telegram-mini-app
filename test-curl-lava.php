<?php
$ch = curl_init('https://api.lava.ru/business/invoice/get-available-tariffs');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['shopId' => 'fe2ad063-1724-4b1d-81bc-5a22178a6505']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

echo '<pre>';
echo 'Error: ' . $error . "\n";
echo 'Response: ' . $response;