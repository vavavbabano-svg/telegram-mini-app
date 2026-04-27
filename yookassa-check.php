<?php
header('Content-Type: application/json');

$paymentId = $_GET['payment_id'] ?? '';
if (!$paymentId) {
    http_response_code(400);
    echo json_encode(['error' => 'payment_id required']);
    exit;
}

$shopId = '1343358';
$secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

$auth = base64_encode($shopId . ':' . $secretKey);

$ch = curl_init("https://api.yookassa.ru/v3/payments/{$paymentId}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Basic ' . $auth
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
echo json_encode(['status' => $data['status'] ?? 'unknown']);
?>