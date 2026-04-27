export default async function handler(req, res) {
  // Разрешаем CORS для Telegram Mini App
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, recipient, stars } = req.body;

  // ВАЖНО: вставь свои ключи
  const shopId = '1343358';
  const secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  const paymentData = {
    amount: {
      value: Number(amount).toFixed(2),
      currency: 'RUB'
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: 'https://fastmystars.vercel.app/success.html'  // замени на свой домен
    },
    description: description?.slice(0, 120) || 'Покупка звёзд',
    metadata: { recipient: recipient || '', stars: stars || 0 }
  };

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': `pay_${Date.now()}_${Math.random().toString(36)}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

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
    console.error('YooKassa error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Внутренняя ошибка сервера' 
    });
  }
}