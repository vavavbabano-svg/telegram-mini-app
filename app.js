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
const theme = tg.themeParams;

function applyTelegramTheme() {
  if (!theme) return;

  document.documentElement.style.setProperty("--tg-bg", theme.bg_color || "#0f1115");
  document.documentElement.style.setProperty("--tg-text", theme.text_color || "#ffffff");
  document.documentElement.style.setProperty("--tg-hint", theme.hint_color || "#8b93a3");
  document.documentElement.style.setProperty("--tg-accent", theme.button_color || "#2d6bff");
}

applyTelegramTheme();

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

/* ================= BUY ================= */
el.buy.onclick = () => {
  const stars = Number(el.stars.value);
  if (!stars) return;

  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return;

  const amount = (stars * RATE).toFixed(2);

  if (!confirm(`⭐ ${stars} → ${amount}₽`)) return;

  tg.sendData(JSON.stringify({
    type: "order",
    user_id: tgUser.id,
    username: tgUser.username || "—",
    stars,
    amount_rub: amount
  }));

  el.stars.value = "";
  update(0);
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