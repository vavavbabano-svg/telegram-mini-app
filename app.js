
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
// USER INIT
// =====================
async function initUser() {

  let { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({
        id: user.id,
        username: user.username || "no_username",
        stars: 0
      })
      .select()
      .single();

    data = newUser;
  }

  document.getElementById("userId").textContent = "#" + data.number;
  document.getElementById("rubOut").textContent = data.stars + " ₽";
}

initUser();

// =====================
// MODE
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
  document.getElementById("stars").value = val;
  document.getElementById("starsOut").textContent = val + " ⭐";
  document.getElementById("rubOut").textContent = val + " ₽";
};

document.getElementById("stars").addEventListener("input", (e) => {
  const val = e.target.value || 0;
  document.getElementById("starsOut").textContent = val + " ⭐";
  document.getElementById("rubOut").textContent = val + " ₽";
});

// =====================
// BUY → SUPABASE UPDATE
// =====================
async function addStars(amount) {

  const { data } = await supabase
    .from("users")
    .select("stars")
    .eq("id", user.id)
    .single();

  await supabase
    .from("users")
    .update({
      stars: data.stars + amount
    })
    .eq("id", user.id);
}

document.querySelector(".buy").onclick = async () => {
  const stars = Number(document.getElementById("stars").value);
  if (!stars) return;

  await addStars(stars);

  alert("Добавлено: " + stars + " ⭐");
};