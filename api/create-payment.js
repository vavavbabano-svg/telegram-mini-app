export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, order_id } = req.body;

  // Твои тестовые ключи (потом заменишь на боевые)
  const shopId = '1343358';
  const secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  // Уникальный ID заказа (можно передать из фронта)
  const idempotenceKey = order_id || `order_${Date.now()}_${Math.random().toString(36)}`;

  const paymentData = {
    amount: {
      value: Number(amount).toFixed(2),
      currency: 'RUB'
    },
    payment_method_data: {
      type: 'bank_card'  // Можно менять на 'sbp' для СБП
    },
    confirmation: {
      type: 'redirect',
      return_url: 'https://telegram-mini-app-ten-gamma.vercel.app/success.html'
    },
    description: description?.slice(0, 120) || 'Покупка звёзд',
    capture: true,
    metadata: {
      order_id: idempotenceKey
    }
  };

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': idempotenceKey
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (data.confirmation?.confirmation_url) {
      // Сохраняем информацию о заказе (временно, можно добавить Firebase)
      // Для простоты — вернём всё фронту
      return res.status(200).json({
        success: true,
        confirmation_url: data.confirmation.confirmation_url,
        payment_id: data.id,
        order_id: idempotenceKey
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.description || 'Ошибка создания платежа'
      });
    }
  } catch (error) {
    console.error('YooKassa error:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}