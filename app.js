alert("app.js работает");
// =====================
// SUPABASE
// =====================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://naxxslgxyelefzdxjhze.supabase.co",
  "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

// =====================
// TELEGRAM
// =====================
const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;

if (!user) {
  alert("Открой через Telegram");
}

// =====================
// ELEMENTS
// =====================
const userIdEl = document.getElementById("userId");
const rubOutEl = document.getElementById("rubOut");
const starsInput = document.getElementById("stars");
const starsOut = document.getElementById("starsOut");

// =====================
// USER INIT
// =====================
async function initUser() {

  let { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {

    const { data: newUser } = await supabase
      .from("users")
      .insert({
        id: user.id,
        username: user.username || "no_username",
        stars: 0,
        number: Date.now() // временный номер (позже сделаем нормальный #1 #2 #3)
      })
      .select()
      .single();

    data = newUser;
  }

  userIdEl.textContent = "#" + (data.number || "0");
  rubOutEl.textContent = (data.stars || 0) + " ₽";
}

initUser();

// =====================
// MODE (себе / другому)
// =====================
const selfBtn = document.getElementById("selfBtn");
const otherBtn = document.getElementById("otherBtn");
const username = document.getElementById("username");

let mode = "self";

username.value = user.username ? "@" + user.username : "@" + user.id;

selfBtn.onclick = () => {
  mode = "self";
  selfBtn.classList.add("active");
  otherBtn.classList.remove("active");

  username.value = "@" + (user.username || user.id);
};

otherBtn.onclick = () => {
  mode = "other";
  otherBtn.classList.add("active");
  selfBtn.classList.remove("active");

  username.value = "";
};

// =====================
// STARS UI
// =====================
window.setStars = function (val) {
  starsInput.value = val;
  starsOut.textContent = val + " ⭐";
  rubOutEl.textContent = val + " ₽";
};

starsInput.addEventListener("input", (e) => {
  const val = e.target.value || 0;
  starsOut.textContent = val + " ⭐";
  rubOutEl.textContent = val + " ₽";
});

// =====================
// ADD STARS
// =====================
async function addStars(amount) {

  const { data } = await supabase
    .from("users")
    .select("stars")
    .eq("id", user.id)
    .maybeSingle();

  await supabase
    .from("users")
    .update({
      stars: (data?.stars || 0) + amount
    })
    .eq("id", user.id);
}

// =====================
// BUY BUTTON
// =====================
document.querySelector(".buy").onclick = async () => {

  const stars = Number(starsInput.value);
  if (!stars || stars <= 0) return;

  await addStars(stars);

  alert("Добавлено: " + stars + " ⭐");

  // обновить UI
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  rubOutEl.textContent = data.stars + " ₽";
};