<?php
// Включаем отображение ошибок для отладки (потом убрать)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Функция для отправки JSON-ответа
function send_json($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

$shopId = '1343358';
$secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

// Читаем тело запроса
$input = file_get_contents('php://input');
if ($input === false) {
    send_json(['error' => 'Failed to read input'], 400);
}

$paymentData = json_decode($input, true);
if (!$paymentData) {
    send_json(['error' => 'Invalid JSON input'], 400);
}

$auth = base64_encode($shopId . ':' . $secretKey);

// Отправляем запрос в ЮKassa
$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Basic ' . $auth,
    'Idempotence-Key: ' . uniqid()
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    send_json(['error' => 'CURL error: ' . $curlError], 500);
}

// Возвращаем ответ от ЮKassa
http_response_code($httpCode);
echo $response;