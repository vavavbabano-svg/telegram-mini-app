const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const PRICE = 1.65;

const starsInput = document.getElementById("stars");
const priceText = document.getElementById("price");

starsInput.addEventListener("input", () => {
  const stars = Number(starsInput.value || 0);
  priceText.innerText = "Цена: " + (stars * PRICE).toFixed(2) + " ₽";
});

function buy() {
  const username = document.getElementById("username").value;
  const stars = Number(document.getElementById("stars").value);

  if (!username || !stars) {
    alert("Заполни поля");
    return;
  }

  let time = 5;

  const interval = setInterval(() => {
    alert("Подтверждение через " + time + " сек");
    time--;

    if (time < 0) {
      clearInterval(interval);

      tg.sendData(JSON.stringify({
        type: "order",
        username,
        stars,
        price: stars * PRICE
      }));

      alert("Заказ отправлен 🚀");
    }
  }, 1000);
}