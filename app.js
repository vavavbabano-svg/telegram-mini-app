const tg = window.Telegram.WebApp;

// 1. говорим Telegram: "приложение готово"
tg.ready();
tg.expand();

// 2. получаем пользователя
const user = tg.initDataUnsafe?.user;

// 3. показываем пользователя на экране
if (user) {
  document.body.innerHTML += `
    <h2>Привет, ${user.first_name} 👋</h2>
    <p>ID: ${user.id}</p>
    <p>@${user.username || "нет username"}</p>
  `;
} else {
  document.body.innerHTML += `<h2>Привет, гость 👋</h2>`;
}

// 4. кнопка "Купить"
function buy() {
  tg.sendData(JSON.stringify({
    action: "buy",
    user_id: user?.id
  }));

  alert("Заказ отправлен 🚀");
}