export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description } = req.body;
  const shopId = '1341702';
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({ success: false, error: 'Server config error' });
  }

  let amountValue = parseFloat(amount);
  if (isNaN(amountValue) || amountValue < 1) {
    return res.status(400).json({ success: false, error: 'Invalid amount' });
  }
  const amountFormatted = amountValue.toFixed(2);
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  const idempotenceKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  const paymentData = {
    amount: { value: amountFormatted, currency: 'RUB' },
    payment_method_data: { type: 'bank_card' },
    confirmation: { type: 'redirect', return_url: 'https://telegram-mini-app-ten-gamma.vercel.app/success.html' },
    capture: true,
    description: description?.slice(0, 120) || 'Покупка звёзд'
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
      return res.status(200).json({ success: true, confirmation_url: data.confirmation.confirmation_url });
    } else {
      return res.status(400).json({ success: false, error: data.description || 'Ошибка создания платежа' });
    }
  } catch (error) {
    console.error('YooKassa error:', error);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
}