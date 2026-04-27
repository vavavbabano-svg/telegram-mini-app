export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Просто тестовый ответ
  return res.status(200).json({
    success: true,
    confirmation_url: 'https://google.com'
  });
}