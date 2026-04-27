export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Логируем всё тело запроса
  console.log('📥 Incoming request body:', req.body);

  let { amount, description } = req.body;

  // Жёсткая очистка суммы
  let amountValue = parseFloat(String(amount).replace(/[^\d.,-]/g, '').replace(',', '.'));
  if (isNaN(amountValue) || amountValue < 1) amountValue = 100;
  if (amountValue > 150000) amountValue = 150000;
  const amountFormatted = amountValue.toFixed(2);

  // Чистим описание
  const cleanDescription = String(description || 'Покупка звёзд')
    .slice(0, 120)
    .replace(/[^a-zA-Zа-яА-Я0-9\s\.,!?-]/g, '')
    .trim();
  const finalDescription = cleanDescription || 'Покупка звёзд';

  // Ключи
  const shopId = '1343358';
  const secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  const idempotenceKey = `pay_${Date.now()}_${Math.random().toString(36).replace(/[^a-z0-9]/gi, '')}`;

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
    description: finalDescription,
    capture: true
  };

  console.log('📤 Sending to YooKassa:', JSON.stringify(paymentData, null, 2));

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
    console.log('📥 YooKassa response:', data);

    if (data.confirmation?.confirmation_url) {
      return res.status(200).json({
        success: true,
        confirmation_url: data.confirmation.confirmation_url
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.description || 'Ошибка создания платежа'
      });
    }
  } catch (error) {
    console.error('🔥 YooKassa error:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка'
    });
  }
}