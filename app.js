const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

// 🧠 ID в левом углу
const userId = user?.id || Math.floor(Math.random() * 99999);
document.getElementById("userId").textContent = "#" + userId;

// =====================
// MODE: себе / другому
// =====================
const selfBtn = document.getElementById("selfBtn");
const otherBtn = document.getElementById("otherBtn");
const username = document.getElementById("username");

let mode = "self";

// по умолчанию
username.value = user?.username ? "@" + user.username : "@" + userId;

selfBtn.onclick = () => {
  mode = "self";
  selfBtn.classList.add("active");
  otherBtn.classList.remove("active");

  username.value = user?.username ? "@" + user.username : "@" + userId;
};

otherBtn.onclick = () => {
  mode = "other";
  otherBtn.classList.add("active");
  selfBtn.classList.remove("active");

  username.value = "";
};

// =====================
// STARS LOGIC
// =====================
function setStars(val) {
  document.getElementById("stars").value = val;
  document.getElementById("starsOut").textContent = val + " ⭐";
  document.getElementById("rubOut").textContent = val + " ₽";
}

document.getElementById("stars").addEventListener("input", (e) => {
  const val = e.target.value || 0;
  document.getElementById("starsOut").textContent = val + " ⭐";
  document.getElementById("rubOut").textContent = val + " ₽";
});