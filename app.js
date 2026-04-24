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

const bg = "#1a1d22";

tg.setHeaderColor(bg);
tg.setBackgroundColor(bg);

// =====================
// ELEMENTS
// =====================
const userIdEl = document.getElementById("userId");
const starsInput = document.getElementById("stars");
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

  let { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", String(tgUser.id))
    .maybeSingle();

  if (error) {
    console.log(error);
    userIdEl.textContent = "#error";
    return;
  }

  // 🔥 если нет юзера — создаём
  if (!data) {

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        id: String(tgUser.id),
        username: tgUser.username || null,
        stars: 0
      })
      .select()
      .single();

    if (insertError) {
      console.log(insertError);
      userIdEl.textContent = "#err";
      return;
    }

    data = newUser;
  }

  // 🔥 ГЛАВНЫЙ ФИКС
  // ждём гарантированно number (если вдруг null — берём id как fallback)
  const displayNumber = data.number || data.id;

  userIdEl.textContent = "#" + displayNumber;
}



// =====================
// CALCULATOR
// =====================
function update(val) {
  const s = Math.max(0, Number(val) || 0);
  const price = (s * RATE).toFixed(2);

  if (rubOut) {
    rubOut.textContent = `${price} ₽`;
  }
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

  // очистка после покупки
  starsInput.value = "";
  update(0);
};

// =====================
// BOTTOM NAV (НОВОЕ)
// =====================
const tabs = {
  tabBuy: "screenBuy",
  tabSell: "screenSell",
  tabRef: "screenRef"
};

// переключение через нижнее меню
document.querySelectorAll(".nav-item").forEach(item => {

  item.addEventListener("click", () => {

    const tab = item.dataset.tab;

    // скрываем все
    Object.values(tabs).forEach(screen => {
      document.getElementById(screen).classList.remove("active");
    });

    // показываем нужный
    document.getElementById(tabs[tab]).classList.add("active");

    // анимация клика
    item.style.transform = "scale(0.95)";
    setTimeout(() => {
      item.style.transform = "scale(1)";
    }, 150);

  });

});

// появление меню
window.addEventListener("load", () => {
  const nav = document.getElementById("bottomNav");

  setTimeout(() => {
    nav.classList.add("show");
  }, 100);
});