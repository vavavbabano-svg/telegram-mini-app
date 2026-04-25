import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const RATE = 1.64;

const supabase = createClient(
  "https://naxxslgxyelefzdxjhze.supabase.co",
  "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
setupAdmin();

/* DOM */
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

/* USER ID */
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
  if (!tgUser) return;

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

  el.userId.textContent = "#" + String(user.number).padStart(4, "0");
}

/* PRICE */
function update(val) {
  const s = Number(val) || 0;
  el.rub.textContent = (s * RATE).toFixed(2) + " ₽";
}

/* PACKS FIX 🔥 */
document.querySelectorAll(".packs button").forEach(btn => {
  btn.addEventListener("click", () => {
    const val = btn.dataset.stars;

    el.stars.value = val;
    update(val);

    document.querySelectorAll(".packs button")
      .forEach(b => b.style.opacity = "0.5");

    btn.style.opacity = "1";
  });
});

/* INPUT */
el.stars.addEventListener("input", e => {
  update(e.target.value);
});

/* TOGGLE */
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

/* BUY */
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

/* ADMIN */
const ADMIN_ID = 1444520038;

function setupAdmin() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (!user) return;

  const myId = Number(user.id);
  const adminId = Number(ADMIN_ID);

  const btn = document.getElementById("adminBtn");
  if (!btn) return;

  if (myId === adminId) {
    btn.classList.remove("hidden");
  } else {
    btn.remove(); // 🔥 полностью убираем у всех остальных
  }
}

/* START */
initUser();