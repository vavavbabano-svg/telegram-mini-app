export default async function handler(req, res) {
  // Разрешаем запросы из любого места
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, confirmation, metadata } = req.body;

  // Твои ключи
  const shopId = '1343358';
  const secretKey = 'test_NjodJO1Gkl9oRh7mCQNmPV0-p7T9ekDH4fBXDlPWR4M';

  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

  const paymentData = {
    amount: { value: Number(amount).toFixed(2), currency: 'RUB' },
    capture: true,
    confirmation: confirmation || { type: 'redirect', return_url: 'https://telegram-mini-app-ten-gamma.vercel.app/success.html' },
    description: description?.slice(0, 120) || 'Покупка звёзд',
    metadata: metadata || {}
  };

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
        'Idempotence-Key': `pay_${Date.now()}_${Math.random().toString(36)}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    
    // Если тип подтверждения "qr" — отдаём QR-код
    if (data.confirmation?.type === 'qr' && data.confirmation?.confirmation_data?.qr_code) {
      return res.status(200).json({
        success: true,
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.confirmation.confirmation_data.qr_code)}`
      });
    }
    
    if (data.confirmation?.confirmation_url) {
      return res.status(200).json({ 
        success: true, 
        confirmation_url: data.confirmation.confirmation_url 
      });
    }
    
    return res.status(400).json({ 
      success: false, 
      error: data.description || 'Ошибка создания платежа' 
    });
  } catch (error) {
    console.error('YooKassa error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера' 
    });
  }
}