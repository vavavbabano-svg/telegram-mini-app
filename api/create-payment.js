export default async function handler(req, res) {
  // Разрешаем запросы
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, order_id } = req.body;

  // Твои ключи
  const shopId = '1343358';
  const secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  // Сумма для ЮKassa: обязательно число и 2 знака после запятой
  let amountValue = Number(amount);
  if (isNaN(amountValue) || amountValue <= 0) amountValue = 100;
  // Ограничиваем максимум 150 000 рублей (лимит СБП/карт)
  if (amountValue > 150000) amountValue = 150000;
  const amountFormatted = amountValue.toFixed(2); // 100.00

  // Правильный ключ идемпотентности: только латиница, цифры, дефис, подчёркивание
  const idempotenceKey = `pay_${Date.now()}_${Math.random().toString(36).replace(/[^a-zA-Z0-9_-]/g, '')}`;

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
    description: description?.slice(0, 120).replace(/[^\w\s.,!?@-]/g, '') || 'Покупка телеграм звёзд',
    capture: true
  };

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
        'Idempotence-Key': idempotenceKey
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (data.confirmation?.confirmation_url) {
      return res.status(200).json({
        success: true,
        confirmation_url: data.confirmation.confirmation_url,
        payment_id: data.id
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