<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'Прокси работает',
    'time' => date('Y-m-d H:i:s')
]);