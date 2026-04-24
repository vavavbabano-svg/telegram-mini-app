const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const token = '8654809780:AAHm6nBkZYWQCDlZ1TbGiEBOCks_zpOF5bE';

const bot = new TelegramBot(token, { polling: true });

// Подключение к Supabase (service_role ключ из .env)
const supabase = createClient(
  'https://naxxslgxyelefzdxjhze.supabase.co',
  'ТВОЙ_SERVICE_ROLE_КЛЮЧ_СЮДА' // ← замени на реальный или process.env.SUPABASE_SERVICE_KEY
);

// Твой Telegram ID для уведомлений
const ADMIN_ID = 'ТВОЙ_TELEGRAM_ID'; // ← вставь свой ID (число)

// =====================
// ОБРАБОТКА ЗАКАЗОВ
// =====================
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  const tgUser = msg.from;

  try {
    const data = JSON.parse(msg.web_app_data.data);

    if (data.type === 'order') {
      console.log('📦 Новый заказ:', data);

      // Сохраняем в Supabase
      const { error: dbError } = await supabase
        .from('orders')
        .insert({
          user_id: data.user_id,
          username: data.username,
          stars: data.stars,
          amount_rub: data.amount_rub,
          status: 'new',
          created_at: new Date()
        });

      if (dbError) {
        console.log('❌ Ошибка сохранения заказа:', dbError);
      } else {
        console.log('✅ Заказ сохранён в БД');
      }

      // Уведомление админу
      const adminMsg = `
🛒 <b>НОВЫЙ ЗАКАЗ!</b>

👤 Юзер: ${data.username}
🆔 ID: ${data.user_id}
⭐ Звёзд: ${data.stars}
💰 Сумма: ${data.amount_rub} ₽

Проверь оплату и начисли звёзды.`;

      await bot.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'HTML' });
    }

  } catch (e) {
    console.log('❌ Ошибка обработки данных:', e.message);
  }
});

// =====================
// КОМАНДЫ
// =====================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '👋 Бот работает. Жди заказы.');
});

bot.onText(/\/orders/, async (msg) => {
  if (String(msg.from.id) !== ADMIN_ID) return;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return bot.sendMessage(msg.chat.id, '❌ Ошибка загрузки заказов');
  }

  if (!data || data.length === 0) {
    return bot.sendMessage(msg.chat.id, '📭 Заказов пока нет');
  }

  const text = data.map(o =>
    `🆔 ${o.id} | 👤 ${o.username} | ⭐ ${o.stars} | 💰 ${o.amount_rub}₽ | ${o.status}`
  ).join('\n');

  bot.sendMessage(msg.chat.id, `<b>Последние заказы:</b>\n${text}`, { parse_mode: 'HTML' });
});

console.log('🤖 Бот запущен');