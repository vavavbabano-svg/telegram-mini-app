<?php
// Включаем вывод всех ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

$shopId = '1343358';
$secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

// Разрешаем только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

$input = file_get_contents('php://input');
if (empty($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit;
}

$auth = base64_encode($shopId . ':' . $secretKey);

// Проверяем, есть ли cURL
if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL not enabled on hosting']);
    exit;
}

$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Basic ' . $auth,
    'Idempotence-Key: ' . uniqid('pay_', true)
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'CURL error: ' . $curlError]);
    exit;
}

http_response_code($httpCode);
echo $response;
?>