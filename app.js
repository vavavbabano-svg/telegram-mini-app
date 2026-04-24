const RATE = 1.64;

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://naxxslgxyelefzdxjhze.supabase.co",
  "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

// =====================
// TELEGRAM
// =====================
const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();
tg.setHeaderColor("#1a1d22");
tg.setBackgroundColor("#1a1d22");
// =====================
// ELEMENTS
// =====================
const userIdEl = document.getElementById("userId");
const starsInput = document.getElementById("stars");
const starsOut = document.getElementById("starsOut");
const rubOut = document.getElementById("rubOut");

const selfBtn = document.getElementById("selfBtn");
const otherBtn = document.getElementById("otherBtn");
const username = document.getElementById("username");

// =====================
// USER (SUPABASE)
// =====================
async function initUser() {

  const tgUser = tg.initDataUnsafe?.user;

  if (!tgUser) {
    userIdEl.textContent = "#guest";
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, username, stars, number")
    .eq("id", String(tgUser.id))
    .maybeSingle();

  if (error) {
    console.log("Supabase error:", error);
    userIdEl.textContent = "#error";
    return;
  }

  if (!data) {
    userIdEl.textContent = "#new";
    return;
  }

  userIdEl.textContent = "#" + (data.number ?? "?");
}

initUser();

// =====================
// CALCULATOR
// =====================
function update(val) {
  const s = Number(val) || 0;
  starsOut.textContent = s + " ⭐";
  rubOut.textContent = (s * RATE).toFixed(2) + " ₽";
}

// =====================
// MODE SWITCH
// =====================
let mode = "self";

selfBtn.onclick = () => {
  mode = "self";
  selfBtn.classList.add("active");
  otherBtn.classList.remove("active");

  const u = tg.initDataUnsafe?.user;
  username.value = u?.username ? "@" + u.username : "@" + u?.id;
};

otherBtn.onclick = () => {
  mode = "other";
  otherBtn.classList.add("active");
  selfBtn.classList.remove("active");

  username.value = "";
};

// =====================
// INPUT
// =====================
starsInput.addEventListener("input", e => {
  update(e.target.value);
});

// =====================
// PACKS
// =====================
window.setStars = (v) => {
  starsInput.value = v;
  update(v);
};

// =====================
// BUY BUTTON
// =====================
document.querySelector(".buy").onclick = async () => {

  const stars = Number(starsInput.value);
  if (!stars || stars <= 0) return;

  const tgUser = tg.initDataUnsafe?.user;

  if (!tgUser) return alert("Нет пользователя");

  const { data } = await supabase
    .from("users")
    .select("stars")
    .eq("id", String(tgUser.id))
    .maybeSingle();

  await supabase
    .from("users")
    .update({
      stars: (data?.stars || 0) + stars
    })
    .eq("id", String(tgUser.id));

  alert("Добавлено: " + stars + " ⭐");
};

// =====================
// TABS
// =====================
const tabs = {
  tabBuy: "screenBuy",
  tabSell: "screenSell",
  tabRef: "screenRef"
};

Object.keys(tabs).forEach(id => {

  document.getElementById(id).onclick = () => {

    Object.values(tabs).forEach(screen => {
      document.getElementById(screen).classList.remove("active");
    });

    Object.keys(tabs).forEach(t => {
      document.getElementById(t).classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
    document.getElementById(tabs[id]).classList.add("active");
  };
});