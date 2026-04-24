const PRICE = 1.65;

const starsInput = document.getElementById("stars");
const starsOut = document.getElementById("starsOut");
const rubOut = document.getElementById("rubOut");

starsInput.addEventListener("input", update);

function update() {
  let s = Number(starsInput.value || 0);
  starsOut.innerText = s + " ⭐";
  rubOut.innerText = (s * PRICE).toFixed(2) + " ₽";
}

function setStars(val) {
  starsInput.value = val;
  update();
}

// если используешь стрелки/пакеты
function adjustPacks(amount) {
  let packValueElement = document.getElementById('packValue');

  if (!packValueElement) return;

  let currentValue = parseInt(packValueElement.innerText, 10);
  let newValue = currentValue + amount;

  if (newValue < 50) newValue = 50;
  if (newValue > 5000) newValue = 5000;

  packValueElement.innerText = newValue;

  starsInput.value = newValue;
  update();
}
const modal = document.getElementById("modal");
const confirmText = document.getElementById("confirmText");
const timerEl = document.getElementById("timer");
const confirmBtn = document.getElementById("confirmBtn");

let countdown;

document.querySelector(".buy").addEventListener("click", () => {
  const stars = starsInput.value;
  const username = document.getElementById("username").value;
  const total = (stars * PRICE).toFixed(2);

  confirmText.innerText = `${username} — ${stars} ⭐ за ${total} ₽`;

  modal.classList.remove("hidden");

  let time = 5;
  timerEl.innerText = time;

  clearInterval(countdown);

  countdown = setInterval(() => {
    time--;
    timerEl.innerText = time;

    if (time <= 0) {
      clearInterval(countdown);
      confirmBtn.disabled = false;
    }
  }, 1000);

  confirmBtn.disabled = true;
});

confirmBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  alert("Заказ отправлен (пока тест)");
});
