<?php
header('Content-Type: application/json');
$apiKey = 'b1bf45a8c14a854ba3869efa8dab836f4921a2b8';
$payload = ['test' => 1];
$signature = hash_hmac('sha256', json_encode($payload), $apiKey);
echo json_encode(['signature' => $signature]);