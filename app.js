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

// --- СИНХРОНИЗАЦИЯ ТЕМЫ С TELEGRAM ---
function syncTelegramTheme() {
  if (!tg) return;

  const bgColor = tg.themeParams.bg_color || '#16161a';
  const textColor = tg.themeParams.text_color || '#E6E6E6';
  const buttonColor = tg.themeParams.button_color || '#2D6BFF';
  const headerBg = tg.themeParams.header_bg_color || bgColor;

  document.documentElement.style.setProperty('--bg', bgColor);
  document.documentElement.style.setProperty('--card', bgColor);
  document.documentElement.style.setProperty('--text', textColor);
  document.documentElement.style.setProperty('--muted', textColor + 'cc');
  document.documentElement.style.setProperty('--blue', buttonColor);
  document.documentElement.style.setProperty('--input', bgColor);
  document.documentElement.style.setProperty('--btn', bgColor);

  tg.setHeaderColor(headerBg);
  tg.setBackgroundColor(bgColor);
}

tg.onEvent('themeChanged', syncTelegramTheme);
syncTelegramTheme();

// --- КНОПКА НАЗАД ДЛЯ СТРАНИЦЫ ОПЛАТЫ ---
function setupBackButton() {
  if (!tg) return;
  if (window.location.pathname.includes('payment.html')) {
    tg.BackButton.show();
    tg.BackButton.onClick(() => window.history.back());
  } else {
    tg.BackButton.hide();
  }
}
setupBackButton();

// --- ОСТАЛЬНАЯ ЛОГИКА (твоя, без изменений) ---
async function initUser() {
  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return;

  const tgId = String(tgUser.id);
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("tg_id", tgId)
    .maybeSingle();

  if (error) console.error("Ошибка user:", error);

  if (el.userId && user?.number) {
    el.userId.textContent = "#" + String(user.number).padStart(4, "0");
    el.userId.style.display = "inline-block";
  } else if (el.userId) {
    el.userId.textContent = "#----";
  }
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
    document.querySelectorAll(".packs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

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

el.self.onclick = () => {
  el.self.classList.add("active");
  el.other.classList.remove("active");
  const u = tg.initDataUnsafe?.user;
  el.username.value = u?.username ? "@" + u.username : "@" + u?.id;
};

el.other.onclick = () => {
  el.other.classList.add("active");
  el.self.classList.remove("active");
  el.username.value = "@";
  el.username.focus();
};

(function setDefaultUsername() {
  const u = tg.initDataUnsafe?.user;
  if (u) {
    el.username.value = u.username ? "@" + u.username : "@" + u.id;
    el.self.classList.add("active");
    el.other.classList.remove("active");
  }
})();

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

let selectedPayment = null;

document.querySelectorAll(".pay-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".pay-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPayment = card.dataset.method;
    currentCurrency = selectedPayment === "ton" ? "TON" : "RUB";
    update(Number(el.stars.value));
  });
});

el.buy.onclick = () => {
  const stars = Number(el.stars.value);
  const username = el.username.value.trim();
  
  if (!username) {
    alert("Введите username получателя");
    return;
  }
  if (!stars || stars < 50) {
    alert("Минимальное количество звёзд: 50");
    return;
  }
  if (!selectedPayment) {
    alert("Пожалуйста, выберите способ оплаты");
    return;
  }

  let total, currency;
  if (selectedPayment === "ton") {
    total = (stars * RATE_TON).toFixed(3) + " TON";
    currency = "TON";
  } else {
    total = (stars * RATE_RUB).toFixed(2) + " ₽";
    currency = "RUB";
  }

  const order = {
    recipient: username,
    stars: stars,
    total: total,
    currency: currency,
    paymentMethod: selectedPayment,
    timestamp: Date.now()
  };
  localStorage.setItem('pendingOrder', JSON.stringify(order));
  window.location.href = 'payment.html';
};

function setupAdmin() {
  const btn = el.admin;
  if (!btn) return;
  btn.classList.remove("hidden");
  btn.style.display = "block";
}

if (el.admin) {
  el.admin.addEventListener("click", async () => {
    try {
      const response = await fetch("https://paypalych-server.onrender.com/admin/stats");
      const stats = await response.json();
      alert(`📊 СТАТИСТИКА\n\nСегодня:\n⭐ Звёзд: ${stats.today.stars}\n💰 Сумма: ${stats.today.amount} ₽\n📦 Заказов: ${stats.today.count}\n\nВсего:\n⭐ Звёзд: ${stats.all.stars}\n💰 Сумма: ${stats.all.amount} ₽\n📦 Заказов: ${stats.all.count}\n\n🔧 Fragment: ${stats.fragment_ready ? "✅" : "❌"}\n🔧 Enot: ${stats.enot_configured ? "✅" : "❌"}`);
    } catch (e) {
      alert("Ошибка загрузки статистики");
    }
  });
}

initUser();
setupAdmin();