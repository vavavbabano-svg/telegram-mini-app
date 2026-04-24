
const RATE = 1.64;

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
  throw new Error("No Telegram user");
}

// =====================
// ELEMENTS
// =====================
const userIdEl = document.getElementById("userId");
const rubOutEl = document.getElementById("rubOut");
const starsInput = document.getElementById("stars");
const starsOut = document.getElementById("starsOut");
const selfBtn = document.getElementById("selfBtn");
const otherBtn = document.getElementById("otherBtn");
const username = document.getElementById("username");

// =====================
// CALCULATOR
// =====================
function updateCalc(val) {
  const stars = Number(val) || 0;

  starsOut.textContent = stars + " ⭐";
  rubOutEl.textContent = (stars * RATE).toFixed(2) + " ₽";
}

// =====================
// USER INIT
// =====================
async function initUser() {

  let { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", String(user.id))
    .maybeSingle();

  if (error) console.log(error);

  if (!data) {

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        id: String(user.id),
        username: user.username || "no_username",
        stars: 0
      })
      .select()
      .single();

    if (insertError) {
      alert("Ошибка: " + insertError.message);
      return;
    }

    data = newUser;
  }

  userIdEl.textContent = "#" + (data.number || "?");
  rubOutEl.textContent = (data.stars || 0) + " ₽";
}

initUser();

// =====================
// MODE
// =====================
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
// STARS INPUT
// =====================
starsInput.addEventListener("input", (e) => {
  updateCalc(e.target.value);
});

// =====================
// PACK BUTTONS
// =====================
window.setStars = function (val) {
  starsInput.value = val;
  updateCalc(val);
};

// =====================
// ADD STARS
// =====================
async function addStars(amount) {

  const { data } = await supabase
    .from("users")
    .select("stars")
    .eq("id", String(user.id))
    .maybeSingle();

  await supabase
    .from("users")
    .update({
      stars: (data?.stars || 0) + amount
    })
    .eq("id", String(user.id));
}

// =====================
// BUY BUTTON
// =====================
document.querySelector(".buy").onclick = async () => {

  const stars = Number(starsInput.value);
  if (!stars || stars <= 0) return;

  await addStars(stars);

  alert(`Добавлено: ${stars} ⭐`);

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", String(user.id))
    .single();

  rubOutEl.textContent = (data.stars * RATE).toFixed(2) + " ₽";
};