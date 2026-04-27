<?php
header('Content-Type: application/json');

$shopId = '1343358';
$secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

$input = file_get_contents('php://input');
if (empty($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body']);
    exit;
}

$auth = base64_encode($shopId . ':' . $secretKey);

$options = [
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Authorization: Basic ' . $auth
        ],
        'content' => $input,
        'ignore_errors' => true
    ]
];

$context = stream_context_create($options);
$response = file_get_contents('https://api.yookassa.ru/v3/payments', false, $context);
$httpCode = $http_response_header ? intval(explode(' ', $http_response_header[0])[1]) : 500;

http_response_code($httpCode);
echo $response;
?>