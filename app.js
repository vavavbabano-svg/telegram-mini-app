import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const RATE = 1.64;

const supabase = createClient(
  "https://naxxslgxyelefzdxjhze.supabase.co",
  "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

const tg = window.Telegram.WebApp;

/* ================= DOM ================= */
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

/* ================= INIT TELEGRAM ================= */
tg.ready();
tg.expand();

/* ================= СИНХРОНИЗАЦИЯ ЦВЕТОВ С TELEGRAM ================= */
function syncTelegramTheme() {
  const theme = tg.themeParams;

  if (theme) {
    const tgBg = theme.bg_color || "#16161a";
    const tgSecondaryBg = theme.secondary_bg_color || "#1e1e24";
    const tgText = theme.text_color || "#E6E6E6";
    const tgHint = theme.hint_color || "#A0A0A0";
    const tgButton = theme.button_color || "#2D6BFF";

    document.documentElement.style.setProperty("--bg", tgBg);
    document.documentElement.style.setProperty("--card", tgSecondaryBg);
    document.documentElement.style.setProperty("--text", tgText);
    document.documentElement.style.setProperty("--muted", tgHint);
    document.documentElement.style.setProperty("--blue", tgButton);
    
    document.documentElement.style.setProperty("--input", tgSecondaryBg);
    document.documentElement.style.setProperty("--btn", tgSecondaryBg);

    tg.setHeaderColor(tgBg);
    tg.setBackgroundColor(tgBg);
  }
}

syncTelegramTheme();

tg.onEvent("themeChanged", syncTelegramTheme);

/* ================= COUNTER ================= */
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

/* ================= USER ================= */
async function initUser() {
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

    const { data } = await supabase
      .from("users")
      .insert({
        tg_id: tgId,
        username: tgUser.username || null,
        stars: 0,
        number
      })
      .select()
      .single();

    user = data;
  }

  if (el.userId && user) {
    el.userId.textContent = "#" + String(user.number).padStart(4, "0");
  }

  return tgUser;
}

/* ================= PRICE ================= */
function update(val) {
  const s = Number(val) || 0;
  el.rub.textContent = (s * RATE).toFixed(2) + " ₽";
}

/* ================= PACKS ================= */
document.querySelectorAll(".packs button").forEach(btn => {
  btn.addEventListener("click", () => {
    const val = btn.dataset.stars;

    el.stars.value = val;
    update(val);

    document.querySelectorAll(".packs button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
  });
});

/* ================= INPUT ================= */
el.stars.addEventListener("input", e => {
  update(e.target.value);
});

/* ================= TOGGLE ================= */
el.self.onclick = () => {
  el.self.classList.add("active");
  el.other.classList.remove("active");

  const u = tg.initDataUnsafe?.user;
  el.username.value = u?.username ? "@" + u.username : "@" + u?.id;
};

el.other.onclick = () => {
  el.other.classList.add("active");
  el.self.classList.remove("active");
  el.username.value = "";
};

/* ================= PAYMENT SELECTION ================= */
let selectedPayment = null;

document.querySelectorAll(".pay-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPayment = card.dataset.method;
  });
});

/* ================= BUY ================= */
el.buy.onclick = () => {
  const stars = Number(el.stars.value);
  if (!stars) return;

  if (!selectedPayment) {
    alert("Пожалуйста, выберите способ оплаты");
    return;
  }

  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return;

  const amount = (stars * RATE).toFixed(2);

  if (!confirm(`⭐ ${stars} → ${amount}₽`)) return;

  tg.sendData(JSON.stringify({
    type: "order",
    user_id: tgUser.id,
    username: tgUser.username || "—",
    stars,
    amount_rub: amount,
    payment_method: selectedPayment
  }));

  el.stars.value = "";
  update(0);
  document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("selected"));
  selectedPayment = null;
};

/* ================= ADMIN FIX ================= */
const ADMIN_ID = 1444520038;

function setupAdmin() {
  const user = tg.initDataUnsafe?.user;
  const btn = el.admin;

  if (!btn || !user) return;

  const myId = Number(user.id);

  if (myId === ADMIN_ID) {
    btn.style.display = "block";
  } else {
    btn.remove();
  }
}

/* ================= START ================= */
(async () => {
  const user = await initUser();
  setupAdmin();
})();