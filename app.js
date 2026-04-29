import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const RUB_PER_STAR = 1.59;
const supabase = createClient(
    "https://naxxslgxyelefzdxjhze.supabase.co",
    "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF"
);

document.addEventListener('DOMContentLoaded', () => {
    let tg = null;
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    const usernameInput = document.getElementById('username');
    const starCountInput = document.getElementById('star-count');
    const btnCountSpan = document.getElementById('btn-count');
    const summaryLabel = document.getElementById('summary-label');
    const totalPriceSpan = document.getElementById('total-price');
    const buyButton = document.getElementById('buyButton');

    if (!starCountInput || !btnCountSpan || !summaryLabel || !totalPriceSpan || !buyButton) return;

    starCountInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); starCountInput.blur(); } });
    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); usernameInput.blur(); } });

    function syncTelegramHeader() {
        if (!tg) return;
        const headerColor = tg.themeParams.header_bg_color || tg.themeParams.bg_color || '#0a0a14';
        tg.setHeaderColor(headerColor);
        tg.setBackgroundColor(tg.themeParams.bg_color || '#0a0a14');
    }
    function applyTelegramTheme() {
        if (!tg) return;
        const card = tg.themeParams.secondary_bg_color || '#0f0f18';
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#0a0a14';
        document.querySelectorAll('.input-group').forEach(el => el.style.backgroundColor = '#0c0c14');
        if (buyButton) buyButton.style.background = `linear-gradient(105deg, #ff5e9e, #b77eff)`;
    }
    if (tg) {
        syncTelegramHeader();
        applyTelegramTheme();
        tg.onEvent('themeChanged', () => { syncTelegramHeader(); applyTelegramTheme(); });
    }

    if (usernameInput && tg?.initDataUnsafe?.user) {
        usernameInput.value = tg.initDataUnsafe.user.username ? '@' + tg.initDataUnsafe.user.username : '@' + tg.initDataUnsafe.user.id;
    }

    function updateTotal() {
        let stars = parseInt(starCountInput.value);
        if (isNaN(stars)) stars = 0;
        if (stars < 0) stars = 0;
        starCountInput.value = stars === 0 ? '' : stars;
        btnCountSpan.innerText = stars;
        summaryLabel.innerText = stars + ' звёзд';
        totalPriceSpan.innerText = (stars * RUB_PER_STAR).toFixed(2);
    }
    starCountInput.addEventListener('input', updateTotal);
    starCountInput.addEventListener('blur', () => { if (!starCountInput.value) { starCountInput.value = 0; updateTotal(); } });
    updateTotal();

    function showConfirmModal(onConfirm) {
        const old = document.querySelector('.modal-overlay');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card">
                <h3>❤️ Подтверждение заказа</h3>
                <p>Вы действительно хотите купить <strong>${starCountInput.value}</strong> звёзд за <strong>${totalPriceSpan.innerText} ₽</strong>?</p>
                <div class="modal-buttons">
                    <button class="modal-btn cancel" id="modalCancel">Отмена</button>
                    <button class="modal-btn confirm" id="modalConfirm">Подтвердить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('modalCancel').onclick = () => modal.remove();
        document.getElementById('modalConfirm').onclick = () => { modal.remove(); onConfirm(); };
    }

    function setButtonLoading(loading) {
        if (loading) {
            buyButton.disabled = true;
            buyButton.innerHTML = '<span class="loader-icon"></span> Создание платежа...';
        } else {
            buyButton.disabled = false;
            buyButton.innerHTML = '<img src="img/R.png" style="width:22px;height:22px;object-fit:contain;"> Купить ' + starCountInput.value + ' звёзд';
        }
    }

    buyButton.onclick = () => {
        let recipient = usernameInput?.value.trim() || 'свой аккаунт';
        let stars = parseInt(starCountInput.value) || 0;
        if (stars <= 0) { alert('Введите количество звёзд (минимум 1)'); return; }
        if (stars < 50) { alert('Минимальное количество звёзд: 50'); return; }

        localStorage.setItem('pendingOrder', JSON.stringify({ recipient, stars, total: totalPriceSpan.innerText + ' ₽' }));

        showConfirmModal(async () => {
            setButtonLoading(true);
            try {
                const res = await fetch('https://lava-api.vavavbabano.workers.dev/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: parseFloat(totalPriceSpan.innerText),
                        description: `Покупка ${stars} звёзд для ${recipient}`,
                        orderId: `order_${Date.now()}`,
                        username: recipient,
                        stars
                    })
                });
                const data = await res.json();
                if (data.success && data.confirmation_url) window.location.href = data.confirmation_url;
                else { alert('Ошибка: ' + (data.error || 'Не удалось создать платёж')); setButtonLoading(false); }
            } catch (err) { alert('Ошибка соединения: ' + err.message); setButtonLoading(false); }
        });
    };

    async function initUser() {
        const tgUser = tg?.initDataUnsafe?.user;
        if (!tgUser) return;
        const { data: user } = await supabase.from("users").select("number").eq("tg_id", String(tgUser.id)).maybeSingle();
        if (user?.number) {
            const el = document.createElement('div');
            el.style.cssText = 'position:fixed; top:12px; left:12px; background:#1c1c28; padding:4px 12px; border-radius:24px; font-size:12px; z-index:1001; backdrop-filter:blur(8px);';
            el.textContent = "#" + String(user.number).padStart(4, "0");
            document.body.appendChild(el);
        }
    }
    initUser();
});