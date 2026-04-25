import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* =========================
   CONFIG
========================= */
const RATE = 1.64;

const supabase = createClient(
  "https://naxxslgxyelefzdxjhze.supabase.co",
  "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

const tg = window.Telegram?.WebApp;

/* =========================
   DOM CACHE
========================= */
const el = {
  userId: document.getElementById("userId"),
  stars: document.getElementById("stars"),
  rub: document.getElementById("rubOut"),
  username: document.getElementById("username"),
  buy: document.querySelector(".buy"),
  self: document.getElementById("selfBtn"),
  other: document.getElementById("otherBtn"),
  admin: document.getElementById("adminBtn")
};

/* =========================
   STATE
========================= */
let currentUser = null;

/* =========================
   INIT TELEGRAM
========================= */
function initTelegram() {
  tg.ready();
  tg.expand();
}

/* =========================
   COUNTER SERVICE
========================= */
async function getNextNumber() {
  const { data } = await supabase
    .from("counters")
    .select("last_number")
    .eq("id", 1)
    .single();

  const next = (data?.last_number || 0) + 1;

  await supabase
    .from("counters")
    .update({ last_number: next })
    .eq("id", 1);

  return next;
}

/* =========================
   USER SERVICE
========================= */
async function loadOrCreateUser() {
  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return null;

  const tgId = String(tgUser.id);

  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("tg_id", tgId)
    .maybeSingle();

  if (!user) {
    const number = await getNextNumber();

    const { data: created } = await supabase
      .from("users")
      .insert({
        tg_id: tgId,
        username: tgUser.username || null,
        stars: 0,
        number
      })
      .select()
      .single();

    user = created;
  }

  return user;
}

/* =========================
   UI RENDER
========================= */
function renderUser(user) {
  if (!user) return;

  el.userId.textContent = "#" + String(user.number).padStart(4, "0");
}

/* =========================
   CALCULATOR
========================= */
function updatePrice(value) {
  const stars = Math.max(0, Number(value) || 0);
  el.rub.textContent = (stars * RATE).toFixed(2) + " ₽";
}

/* =========================
   BUY FLOW
========================= */
function setupBuy() {
  el.buy?.addEventListener("click", () => {
    const stars = Number(el.stars.value);
    if (!stars) return;

    const tgUser = tg.initDataUnsafe?.user;
    if (!tgUser) return;

    const amount = (stars * RATE).toFixed(2);

    const ok = confirm(`⭐ ${stars} → ${amount}₽`);
    if (!ok) return;

    tg.sendData(JSON.stringify({
      type: "order",
      user_id: tgUser.id,
      username: tgUser.username || "—",
      stars,
      amount_rub: amount
    }));

    el.stars.value = "";
    updatePrice(0);
  });
}

/* =========================
   TOGGLES
========================= */
function setupToggle() {
  el.self?.addEventListener("click", () => {
    el.self.classList.add("active");
    el.other.classList.remove("active");

    const u = tg.initDataUnsafe?.user;
    el.username.value = u?.username ? "@" + u.username : "@" + u?.id;
  });

  el.other?.addEventListener("click", () => {
    el.other.classList.add("active");
    el.self.classList.remove("active");
    el.username.value = "";
  });
}

/* =========================
   ADMIN BUTTON
========================= */
function setupAdmin() {
  const ADMIN_ID = 1444520038;
  const user = tg.initDataUnsafe?.user;

  if (user?.id === ADMIN_ID && el.admin) {
    el.admin.classList.remove("hidden");

    el.admin.onclick = () => {
      window.location.href = "/admin.html";
    };
  }
}

/* =========================
   INPUTS
========================= */
function setupInputs() {
  el.stars?.addEventListener("input", e => {
    updatePrice(e.target.value);
  });
}

/* =========================
   INIT APP
========================= */
async function initApp() {
  initTelegram();

  setupInputs();
  setupToggle();
  setupBuy();
  setupAdmin();

  currentUser = await loadOrCreateUser();
  renderUser(currentUser);

  console.log("APP READY:", currentUser);
}

initApp();