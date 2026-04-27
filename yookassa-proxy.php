<?php
// Включаем вывод ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Обязательно выставляем JSON-заголовок
header('Content-Type: application/json');

// Твои тестовые ключи
$shopId = '1343358';
$secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

// Получаем тело запроса
$input = file_get_contents('php://input');

// Если тело пустое — ошибка
if (empty($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit;
}

// Декодируем JSON
$paymentData = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit;
}

// Логируем запрос (для отладки на хостинге)
error_log('SBP Request: ' . $input);

// Формируем авторизацию
$auth = base64_encode($shopId . ':' . $secretKey);

// Инициализируем cURL
$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Basic ' . $auth,
    'Idempotence-Key: ' . uniqid('sbp_', true)
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // временно для Beget
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Выполняем запрос
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Проверяем ошибки cURL
if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'CURL error: ' . $curlError]);
    error_log('CURL Error: ' . $curlError);
    exit;
}

// Отправляем ответ
http_response_code($httpCode);
echo $response;
error_log('SBP Response: ' . $response);
?>