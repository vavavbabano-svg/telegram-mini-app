export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, description } = req.body || {};

    if (!amount) {
      return res.status(400).json({ error: 'No amount' });
    }

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': Date.now().toString(),
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: {
          value: Number(amount).toFixed(2),
          currency: 'RUB'
        },
        payment_method_data: {
          type: 'sbp'
        },
        confirmation: {
          type: 'redirect',
          return_url: 'https://your-domain.vercel.app'
        },
        capture: true,
        description: description || 'SBP payment'
      })
    });

let data;

try {
  const text = await res.text();
  data = JSON.parse(text);
} catch (e) {
  alert("Сервер вернул не JSON");
  return;
}

if (!res.ok) {
  alert(data.error || "Ошибка платежа");
  return;
}

    // 👇 ВАЖНО: если ЮKassa вернула ошибку
    if (!response.ok) {
      return res.status(400).json({
        error: data?.description || 'YooKassa error',
        raw: data
      });
    }

    return res.status(200).json({
      success: true,
      confirmation_url: data?.confirmation?.confirmation_url || null
    });

  } catch (e) {
    return res.status(500).json({
      error: e.message
    });
  }
}