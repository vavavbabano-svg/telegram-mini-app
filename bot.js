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