import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const RATE_RUB = 1.64;        // курс: 1 звезда = 1.64 рубля
const RATE_TON = 0.015;       // курс: 1 звезда = 0.015 TON

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

/* ================= ФИКСИРОВАННЫЕ ЦВЕТА ================= */
function applyFixedTheme() {
  const bg = "#16161a";
  const card = "#1e1e24";
  const text = "#E6E6E6";
  const muted = "#A0A0A0";
  const blue = "#2D6BFF";

  document.documentElement.style.setProperty("--bg", bg);
  document.documentElement.style.setProperty("--card", card);
  document.documentElement.style.setProperty("--text", text);
  document.documentElement.style.setProperty("--muted", muted);
  document.documentElement.style.setProperty("--blue", blue);
  document.documentElement.style.setProperty("--input", card);
  document.documentElement.style.setProperty("--btn", card);

  tg.setHeaderColor(bg);
  tg.setBackgroundColor(bg);
}

applyFixedTheme();

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

/* ================= ВАЛЮТА И КУРС ================= */
let currentCurrency = "RUB";   // RUB или TON

function update(val) {
  const s = Number(val) || 0;
  const currencyLabel = document.getElementById("currencyLabel");
  
  if (currentCurrency === "TON") {
    const tonAmount = (s * RATE_TON).toFixed(3);
    el.rub.textContent = tonAmount + " TON";
    if (currencyLabel) currencyLabel.textContent = "TON";
  } else {
    el.rub.textContent = (s * RATE_RUB).toFixed(2) + " ₽";
    if (currencyLabel) currencyLabel.textContent = "RUB";
  }
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
  let val = Number(e.target.value);
  
  // Минимум 50 звёзд
  if (val < 50) {
    val = 50;
    e.target.value = 50;
  }
  
  update(val);
});

// Устанавливаем минимум при загрузке
el.stars.setAttribute("min", "50");
el.stars.value = 50;
update(50);

/* ================= TOGGLE СЕБЕ / ДРУГОМУ ================= */
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

// Сразу ставим юзернейм при загрузке
(function setDefaultUsername() {
  const u = tg.initDataUnsafe?.user;
  if (u) {
    el.username.value = u.username ? "@" + u.username : "@" + u.id;
    el.self.classList.add("active");
    el.other.classList.remove("active");
  }
})();

/* ================= PAYMENT SELECTION ================= */
let selectedPayment = null;

document.querySelectorAll(".pay-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPayment = card.dataset.method;

    // Меняем валюту в зависимости от выбора
    if (selectedPayment === "ton") {
      currentCurrency = "TON";
    } else {
      currentCurrency = "RUB";
    }
    
    // Обновляем отображение цены
    update(Number(el.stars.value));
  });
});

/* ================= BUY ================= */
el.buy.onclick = () => {
  const stars = Number(el.stars.value);
  if (!stars || stars < 50) {
    alert("Минимальное количество звёзд: 50");
    return;
  }

  if (!selectedPayment) {
    alert("Пожалуйста, выберите способ оплаты");
    return;
  }

  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return;

  let amount, currency;
  if (selectedPayment === "ton") {
    amount = (stars * RATE_TON).toFixed(3);
    currency = "TON";
  } else {
    amount = (stars * RATE_RUB).toFixed(2);
    currency = "RUB";
  }

  if (!confirm(`⭐ ${stars} → ${amount} ${currency}`)) return;

  tg.sendData(JSON.stringify({
    type: "order",
    user_id: tgUser.id,
    username: tgUser.username || "—",
    stars,
    amount: amount,
    currency: currency,
    payment_method: selectedPayment
  }));

  // Сброс
  el.stars.value = 50;
  update(50);
  document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("selected"));
  selectedPayment = null;
  currentCurrency = "RUB";
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