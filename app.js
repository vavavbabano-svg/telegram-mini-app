import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const RATE_RUB = 1.64;
const RATE_TON = 0.015;

const supabase = createClient(
  "https://naxxslgxyelefzdxjhze.supabase.co",
  "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

const tg = window.Telegram.WebApp;

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

tg.ready();
tg.expand();

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

let currentCurrency = "RUB";

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
  let val = e.target.value;
  
  if (val === "") {
    update(0);
    return;
  }
  
  update(Number(val));
});

el.stars.value = 50;
update(50);

/* ================= ЗАКРЫТИЕ КЛАВИАТУРЫ ПО ENTER ================= */
el.stars.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    el.stars.blur();
  }
});

el.username.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    el.username.blur();
  }
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

(function setDefaultUsername() {
  const u = tg.initDataUnsafe?.user;
  if (u) {
    el.username.value = u.username ? "@" + u.username : "@" + u.id;
    el.self.classList.add("active");
    el.other.classList.remove("active");
  }
})();

/* ================= КЛАВИАТУРА НЕ ДВИГАЕТ КНОПКУ ================= */
const buyBtn = el.buy;
buyBtn.style.transition = "none";

el.stars.addEventListener("focus", () => {
  buyBtn.style.position = "relative";
  buyBtn.style.bottom = "auto";
  buyBtn.style.marginTop = "12px";
  buyBtn.style.width = "100%";
  buyBtn.style.maxWidth = "100%";
  buyBtn.style.transform = "none";
  buyBtn.style.left = "auto";
});

el.username.addEventListener("focus", () => {
  buyBtn.style.position = "relative";
  buyBtn.style.bottom = "auto";
  buyBtn.style.marginTop = "12px";
  buyBtn.style.width = "100%";
  buyBtn.style.maxWidth = "100%";
  buyBtn.style.transform = "none";
  buyBtn.style.left = "auto";
});

el.stars.addEventListener("blur", () => {
  setTimeout(() => {
    buyBtn.style.position = "fixed";
    buyBtn.style.bottom = "12px";
    buyBtn.style.left = "50%";
    buyBtn.style.transform = "translateX(-50%)";
    buyBtn.style.marginTop = "0";
    buyBtn.style.width = "calc(100% - 24px)";
    buyBtn.style.maxWidth = "420px";
  }, 200);
});

el.username.addEventListener("blur", () => {
  setTimeout(() => {
    buyBtn.style.position = "fixed";
    buyBtn.style.bottom = "12px";
    buyBtn.style.left = "50%";
    buyBtn.style.transform = "translateX(-50%)";
    buyBtn.style.marginTop = "0";
    buyBtn.style.width = "calc(100% - 24px)";
    buyBtn.style.maxWidth = "420px";
  }, 200);
});

/* ================= PAYMENT ================= */
let selectedPayment = null;

document.querySelectorAll(".pay-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPayment = card.dataset.method;

    if (selectedPayment === "ton") {
      currentCurrency = "TON";
    } else {
      currentCurrency = "RUB";
    }
    
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

  const orderId = `stars${stars}_${Date.now()}`;
  const username = tgUser.username || tgUser.id;

  // Ссылка на платежную страницу для пользователя (для GET-запроса)
  const enotUrl = `https://enot.io/pay?` +
    `order_id=${orderId}` +
    `&amount=${amount}` +
    `&currency=${currency}` +
    `&success_url=https://telegram-mini-app.vavavbabano.workers.dev/success.html` +
    `&fail_url=https://telegram-mini-app.vavavbabano.workers.dev/fail.html`;

  tg.sendData(JSON.stringify({
    type: "order",
    user_id: tgUser.id,
    username: tgUser.username || "—",
    stars,
    amount: amount,
    currency: currency,
    payment_method: selectedPayment
  }));
  
  window.location.href = enotUrl;
};

/* ================= ADMIN ================= */
const ADMIN_ID = 1444520038;

function setupAdmin() {
  const user = tg.initDataUnsafe?.user;
  const btn = el.admin;

  if (!btn || !user) return;

  const myId = Number(user.id);

  if (myId === ADMIN_ID) {
    btn.classList.remove("hidden");
    btn.style.display = "block";
  } else {
    btn.remove();
  }
}

/* ================= ADMIN CLICK ================= */
el.admin.addEventListener("click", async () => {
  try {
    const response = await fetch("https://paypalych-server.onrender.com/admin/stats");
    const stats = await response.json();
    
    const msg = 
      `📊 СТАТИСТИКА\n\n` +
      `Сегодня:\n` +
      `⭐ Звёзд: ${stats.today.stars}\n` +
      `💰 Сумма: ${stats.today.amount} ₽\n` +
      `📦 Заказов: ${stats.today.count}\n\n` +
      `Всего:\n` +
      `⭐ Звёзд: ${stats.all.stars}\n` +
      `💰 Сумма: ${stats.all.amount} ₽\n` +
      `📦 Заказов: ${stats.all.count}\n\n` +
      `🔧 Fragment: ${stats.fragment_ready ? "✅" : "❌"}\n` +
      `🔧 Enot: ${stats.enot_configured ? "✅" : "❌"}`;
    
    alert(msg);
  } catch (e) {
    alert("Ошибка загрузки статистики");
  }
});

(async () => {
  await initUser();
  setupAdmin();
})();