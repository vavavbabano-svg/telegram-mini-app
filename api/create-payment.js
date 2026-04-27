export default async function handler(req, res) {
  // Разрешаем CORS и ставим тип ответа
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Получаем сумму и описание из запроса
  const { amount, description } = req.body;

  // Проверяем сумму
  let amountValue = parseFloat(amount);
  if (isNaN(amountValue) || amountValue < 1) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  const amountFormatted = amountValue.toFixed(2);

  // ТВОИ КЛЮЧИ (тестовые)
  const shopId = '1343358';
  const secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

  // Авторизация
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  // Уникальный ключ идемпотентности (без спецсимволов)
  const idempotenceKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Данные для ЮKassa
  const paymentData = {
    amount: {
      value: amountFormatted,
      currency: 'RUB'
    },
    payment_method_data: {
      type: 'bank_card'
    },
    confirmation: {
      type: 'redirect',
      return_url: 'https://telegram-mini-app-ten-gamma.vercel.app/success.html'
    },
    description: description ? description.slice(0, 120) : 'Покупка звёзд Telegram',
    capture: true
  };

  try {
    // Запрос к ЮKassa
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

    console.log('YooKassa response:', data);

    // Если есть ссылка на оплату — возвращаем её
    if (data.confirmation && data.confirmation.confirmation_url) {
      return res.status(200).json({
        success: true,
        confirmation_url: data.confirmation.confirmation_url
      });
    } else {
      // Иначе — возвращаем ошибку
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