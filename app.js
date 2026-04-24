const RATE = 1.64;

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://naxxslgxyelefzdxjhze.supabase.co",
  "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

// TELEGRAM
const tg = window.Telegram.WebApp;
tg.expand();

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user || tg.initDataUnsafe?.receiver;

const userIdEl = document.getElementById("userId");

if (user) {
  userIdEl.textContent = "#" + (user.id || "unknown");
} else {
  userIdEl.textContent = "#guest";
}

if (!user) {
  alert("Открой через Telegram");
}

// ELEMENTS
const starsInput = document.getElementById("stars");
const starsOut = document.getElementById("starsOut");
const rubOut = document.getElementById("rubOut");

const selfBtn = document.getElementById("selfBtn");
const otherBtn = document.getElementById("otherBtn");

const username = document.getElementById("username");

// CALC
function update(val) {
  const s = Number(val) || 0;
  starsOut.textContent = s + " ⭐";
  rubOut.textContent = (s * RATE).toFixed(2) + " ₽";
}

// MODE
let mode = "self";

selfBtn.onclick = () => {
  mode = "self";
  selfBtn.classList.add("active");
  otherBtn.classList.remove("active");

  username.value = "@" + (user?.username || user?.id);
};

otherBtn.onclick = () => {
  mode = "other";
  otherBtn.classList.add("active");
  selfBtn.classList.remove("active");

  username.value = "";
};

// INPUT
starsInput.addEventListener("input", e => update(e.target.value));

// PACKS
window.setStars = (v) => {
  starsInput.value = v;
  update(v);
};

// BUY (без изменения логики)
document.querySelector(".buy").onclick = () => {
  alert("Покупка: " + starsInput.value);
};

// TABS
const tabs = {
  tabBuy: "screenBuy",
  tabSell: "screenSell",
  tabRef: "screenRef"
};

Object.keys(tabs).forEach(id => {
  document.getElementById(id).onclick = () => {
    Object.values(tabs).forEach(s => {
      document.getElementById(s).classList.remove("active");
    });

    Object.keys(tabs).forEach(t => {
      document.getElementById(t).classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
    document.getElementById(tabs[id]).classList.add("active");
  };
});
