const TelegramBot = require('node-telegram-bot-api');

const token = '8654809780:AAHm6nBkZYWQCDlZ1TbGiEBOCks_zpOF5bE';

const bot = new TelegramBot(token, { polling: true });

let orders = [];

bot.on('web_app_data', (msg) => {
  const data = JSON.parse(msg.web_app_data.data);

  if (data.type === "order") {
    orders.push(data);

    console.log("Новый заказ:", data);
  }
});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://naxxslgxyelefzdxjhze.supabase.co',
  'YOUR_SERVICE_ROLE_KEY' // ← возьми из Supabase → Settings → API → service_role
);

bot.on('web_app_data', async (msg) => {
  const data = JSON.parse(msg.web_app_data.data);

  if (data.type === 'order') {
    console.log('Новый заказ:', data);

    const { error } = await supabase
      .from('orders') // ← надо создать таблицу orders в Supabase
      .insert({
        user_id: String(msg.from.id),
        username: data.username,
        stars: data.stars,
        amount_rub: data.amount_rub,
        status: 'new',
        created_at: new Date()
      });

    if (error) {
      console.log('Ошибка сохранения:', error);
    }
  }
});
// В mini app, когда юзер нажимает "Купить"
tg.sendData(JSON.stringify({
  type: "order",
  username: username.value,
  stars: Number(starsInput.value),
  amount_rub: (Number(starsInput.value) * RATE).toFixed(2)
}));