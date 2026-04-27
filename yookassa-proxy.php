<?php
// Включаем вывод всех ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

// Твои тестовые ключи
$shopId = '1343358';
$secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

// Получаем тело запроса
$input = file_get_contents('php://input');
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit;
}

$paymentData = json_decode($input, true);
if (!$paymentData) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit;
}

// Логируем входящий запрос (будет видно в error_log Beget)
error_log('ЮKassa запрос: ' . json_encode($paymentData));

$auth = base64_encode($shopId . ':' . $secretKey);

$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Basic ' . $auth,
    'Idempotence-Key: ' . uniqid('test_', true)
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // временно для теста на Beget

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'CURL error: ' . $curlError]);
    error_log('CURL ошибка: ' . $curlError);
    exit;
}

http_response_code($httpCode);
echo $response;
error_log('ЮKassa ответ: ' . $response);
?>