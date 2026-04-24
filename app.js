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
function adjustPacks(amount) {
  let packValueElement = document.getElementById('packValue');
  let currentValue = parseInt(packValueElement.innerText, 10);
  let newValue = currentValue + amount;

  // Ограничим минимальное и максимальное значение
  if (newValue < 50) newValue = 50;
  if (newValue > 5000) newValue = 5000;

  packValueElement.innerText = newValue;
  // Обновляем количество звёзд в input
  document.getElementById('stars').value = newValue;
  update(); // обновляем расчёт рублёй
}