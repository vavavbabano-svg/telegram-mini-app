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