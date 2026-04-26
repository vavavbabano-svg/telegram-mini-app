const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const token = process.env.BOT_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ID = process.env.ADMIN_ID || '1444520038';

if (!token || !supabaseUrl || !supabaseKey) {
  console.error('❌ BOT_TOKEN, SUPABASE_URL или SUPABASE_SERVICE_KEY не заданы');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const supabase = createClient(supabaseUrl, supabaseKey);

bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  const tgUser = msg.from;
  try {
    const data = JSON.parse(msg.web_app_data.data);
    if (data.type === 'order') {
      console.log('📦 Новый заказ:', data);
      const { error: dbError } = await supabase.from('orders').insert({
        user_id: data.user_id, username: data.username,
        stars: data.stars, amount_rub: data.amount_rub,
        status: 'new', created_at: new Date()
      });
      if (dbError) { console.log('❌ Ошибка сохранения заказа:', dbError); }
      else { console.log('✅ Заказ сохранён в БД'); }
      const adminMsg = `🛒 <b>НОВЫЙ ЗАКАЗ!</b>\n\n👤 Юзер: ${data.username}\n🆔 ID: ${data.user_id}\n⭐ Звёзд: ${data.stars}\n💰 Сумма: ${data.amount_rub} ₽\n\nПроверь оплату и начисли звёзды.`;
      await bot.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'HTML' });
    }
  } catch (e) { console.log('❌ Ошибка обработки данных:', e.message); }
});

bot.onText(/\/start/, (msg) => { bot.sendMessage(msg.chat.id, '👋 Бот работает. Жди заказы.'); });

bot.onText(/\/orders/, async (msg) => {
  if (String(msg.from.id) !== ADMIN_ID) return;
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10);
  if (error) { return bot.sendMessage(msg.chat.id, '❌ Ошибка загрузки заказов'); }
  if (!data || data.length === 0) { return bot.sendMessage(msg.chat.id, '📭 Заказов пока нет'); }
  const text = data.map(o => `🆔 ${o.id} | 👤 ${o.username} | ⭐ ${o.stars} | 💰 ${o.amount_rub}₽ | ${o.status}`).join('\n');
  bot.sendMessage(msg.chat.id, `<b>Последние заказы:</b>\n${text}`, { parse_mode: 'HTML' });
});

console.log('🤖 Бот запущен');