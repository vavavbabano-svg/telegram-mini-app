<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$amount = $input['amount'] ?? 0;
$description = $input['description'] ?? 'Покупка звёзд Telegram';
$orderId = $input['orderId'] ?? 'order_' . time();

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid amount']);
    exit;
}

// ========== ТВОИ ДАННЫЕ LAVA ==========
$shopId = 'fe2ad063-1724-4b1d-81bc-5a22178a6505';
$apiKey = 'b1bf45a8c14a854ba3869efa8dab836f4921a2b8';  // ЗАМЕНИ!

// Параметры счёта
$payload = [
    'shopId' => $shopId,
    'sum' => (float)$amount,
    'orderId' => $orderId,
    'successUrl' => 'https://fastmystars.ru/success.html',
    'failUrl' => 'https://fastmystars.ru/fail.html',
    'comment' => $description,
    'expire' => 300,
    'includeService' => ['card', 'sbp']
];

// Подпись запроса
$signature = hash_hmac('sha256', json_encode($payload), $apiKey);

// Отправка в Lava
$ch = curl_init('https://api.lava.ru/business/invoice/create');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json',
    'Signature: ' . $signature
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode === 200 && isset($data['data']['url'])) {
    echo json_encode([
        'success' => true,
        'confirmation_url' => $data['data']['url']
    ]);
} else {
    http_response_code($httpCode === 200 ? 400 : $httpCode);
    echo json_encode([
        'success' => false,
        'error' => $data['error'] ?? $data['message'] ?? 'Ошибка создания счёта'
    ]);
}