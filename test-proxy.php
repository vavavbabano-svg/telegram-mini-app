<?php
// Простой тестовый скрипт: всегда возвращает JSON
header('Content-Type: application/json');
echo json_encode([
    'status' => 'ok',
    'message' => 'Прокси работает, PHP в порядке',
    'time' => date('Y-m-d H:i:s')
]);