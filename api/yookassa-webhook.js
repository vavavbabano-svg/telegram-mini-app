export default async function handler(req, res) {
  // Принимаем только POST от ЮKassa
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;

  console.log('Webhook received:', event);

  // Обрабатываем событие "платёж ожидает подтверждения"
  if (event.object?.status === 'waiting_for_capture') {
    const paymentId = event.object.id;
    
    // Подтверждаем платёж
    const captureResult = await capturePayment(paymentId);
    
    if (captureResult) {
      // Здесь можно обновить статус заказа в Firebase или другом хранилище
      console.log(`Платёж ${paymentId} успешно подтверждён`);
      
      // Отправляем уведомление пользователю (через Telegram бота)
      // await sendNotificationToUser(orderId);
    }
  }

  // Всегда отвечаем OK, чтобы ЮKassa не дублировала запросы
  res.status(200).json({ error: 'ok' });
}

// Функция подтверждения платежа
async function capturePayment(paymentId) {
  const shopId = '1343358';
  const secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  try {
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    const data = await response.json();
    console.log('Capture response:', data);
    
    return data.status === 'succeeded';
  } catch (error) {
    console.error('Capture error:', error);
    return false;
  }
}