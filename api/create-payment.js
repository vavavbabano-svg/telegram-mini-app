export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description } = req.body;

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': Math.random().toString(36).substring(7),
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64')
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB'
        },
        payment_method_data: {
          type: 'sbp'
        },
        confirmation: {
          type: 'redirect',
          return_url: 'https://https://telegram-mini-app-ten-gamma.vercel.app/'
        },
        capture: true,
        description
      })
    });

    const data = await response.json();

    res.status(200).json({
      success: true,
      confirmation_url: data.confirmation?.confirmation_url
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}