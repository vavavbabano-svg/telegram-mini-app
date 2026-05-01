(function() {
    const RUB_PER_STAR = 1.45;
    let quantity = 100;
    let tg = null;
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    // Supabase (только чтение)
    const SUPABASE_URL = 'https://naxxslgxyelefzdxjhze.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF';

    // ===== РЕФЕРАЛЬНАЯ СИСТЕМА =====
    let MY_ID = localStorage.getItem('myStars_uid');
    if (!MY_ID && tg?.initDataUnsafe?.user?.id) {
        MY_ID = tg.initDataUnsafe.user.id.toString();
        localStorage.setItem('myStars_uid', MY_ID);
    }
    if (!MY_ID) {
        MY_ID = 'USER_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('myStars_uid', MY_ID);
    }

    // Реферальная ссылка
    const refLink = `https://t.me/MyStars812_bot?startapp=ref_${MY_ID}`;
    const refLinkEl = document.getElementById('refLink');
    if (refLinkEl) refLinkEl.textContent = refLink;

    // Копирование ссылки
    const copyRefBtn = document.getElementById('copyRefBtn');
    if (copyRefBtn) {
        copyRefBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(refLink).then(() => {
                alert('✅ Ссылка скопирована!');
            }).catch(() => {
                alert('📋 Скопируй вручную:\n' + refLink);
            });
        });
    }

    // Проверка реферала при заходе
    let refParam = null;
    if (tg?.initDataUnsafe?.start_param) {
        refParam = tg.initDataUnsafe.start_param;
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        refParam = urlParams.get('startapp') || urlParams.get('tgWebAppStartParam');
    }

    if (refParam && refParam.startsWith('ref_') && !localStorage.getItem('myStars_referrer')) {
        const referrerId = refParam.replace('ref_', '');
        if (referrerId !== MY_ID) {
            localStorage.setItem('myStars_referrer', referrerId);
            
            const balances = JSON.parse(localStorage.getItem('myStars_balances') || '{}');
            balances[referrerId] = (balances[referrerId] || 0) + 5;
            localStorage.setItem('myStars_balances', JSON.stringify(balances));
            
            const referrers = JSON.parse(localStorage.getItem('myStars_referrers') || '{}');
            referrers[referrerId] = (referrers[referrerId] || 0) + 1;
            localStorage.setItem('myStars_referrers', JSON.stringify(referrers));
        }
    }

    function updateRefUI() {
        const referrers = JSON.parse(localStorage.getItem('myStars_referrers') || '{}');
        const myRefs = referrers[MY_ID] || 0;
        const refCountEl = document.getElementById('refCount');
        if (refCountEl) refCountEl.textContent = myRefs;
        
        const balances = JSON.parse(localStorage.getItem('myStars_balances') || '{}');
        const myBalance = balances[MY_ID] || 0;
        const refBalanceEl = document.getElementById('refBalance');
        if (refBalanceEl) refBalanceEl.textContent = myBalance + ' ⭐';
    }

    // Вывод средств
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            const balances = JSON.parse(localStorage.getItem('myStars_balances') || '{}');
            const myBalance = balances[MY_ID] || 0;
            
            if (myBalance < 50) {
                alert('Минимум для вывода: 50 звёзд');
                return;
            }
            
            if (confirm(`Вывести ${myBalance} звёзд? Заявка отправится администратору.`)) {
                const message = `📤 Заявка на вывод\n👤 ID: ${MY_ID}\n⭐ Сумма: ${myBalance} звёзд`;
                
                fetch('https://api.telegram.org/bot8654809780:AAHm6nBkZYWQCDlZ1TbGiEBOCks_zpOF5bE/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: '1444520038', text: message })
                }).then(res => res.json()).then(data => {
                    if (data.ok) {
                        balances[MY_ID] = 0;
                        localStorage.setItem('myStars_balances', JSON.stringify(balances));
                        updateRefUI();
                        alert('✅ Заявка отправлена! Админ свяжется с вами.');
                    } else {
                        alert('❌ Ошибка отправки');
                    }
                }).catch(() => {
                    alert('❌ Ошибка соединения');
                });
            }
        });
    }

    // ===== ПОКУПКА =====
    const usernameInput = document.getElementById('username');
    const starCountInput = document.getElementById('star-count');
    const summaryQty = document.getElementById('summaryQty');
    const totalPriceSpan = document.getElementById('totalPrice');
    const btnText = document.getElementById('btnText');
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const purchaseBtn = document.getElementById('purchaseBtn');
    const usernameCard = document.getElementById('usernameCard');

    usernameInput.addEventListener('input', () => {
        usernameInput.value = usernameInput.value.replace(/@/g, '');
    });

    function formatPrice(value) {
        return value.toFixed(2).replace('.', ',') + ' ₽';
    }

    function updateUI() {
        if (starCountInput) starCountInput.value = quantity === 0 ? '' : quantity;
        summaryQty.innerText = quantity;
        totalPriceSpan.innerText = formatPrice(quantity * RUB_PER_STAR);
        btnText.innerText = `Купить ${quantity} звёзд`;
        if (btnMinus) {
            if (quantity <= 50) btnMinus.classList.add('quantity__btn--disabled');
            else btnMinus.classList.remove('quantity__btn--disabled');
        }
    }

    function changeQuantity(delta) {
        let newVal = quantity + delta;
        if (newVal < 50 || newVal > 999999) return;
        quantity = newVal;
        updateUI();
    }

    btnMinus?.addEventListener('click', () => changeQuantity(-10));
    btnPlus?.addEventListener('click', () => changeQuantity(10));

    function handleManualInput() {
        if (!starCountInput) return;
        let raw = starCountInput.value.trim();
        let newQuantity = raw === '' ? 0 : parseInt(raw) || quantity;
        if (newQuantity < 0) newQuantity = 0;
        if (newQuantity > 999999) newQuantity = 999999;
        if (quantity !== newQuantity) { quantity = newQuantity; updateUI(); }
    }

    starCountInput?.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
        e.target.value = val;
        handleManualInput();
    });
    starCountInput?.addEventListener('blur', () => { if (!starCountInput.value) { quantity = 0; updateUI(); } });
    starCountInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); starCountInput.blur(); } });

    function validateUsername() {
        const val = usernameInput.value.trim();
        if (val === '') {
            usernameCard.style.borderColor = 'rgba(239, 68, 68, 0.7)';
            usernameCard.classList.add('shake');
            setTimeout(() => usernameCard.classList.remove('shake'), 600);
            usernameInput.focus();
            return false;
        }
        return true;
    }

    async function createLavaPayment(amount, stars, recipient) {
        const res = await fetch('https://lava-api.vavavbabano.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, description: `Покупка ${stars} звёзд для ${recipient}`, orderId: `order_${Date.now()}`, username: recipient, stars })
        });
        return res.json();
    }

    async function loadRaffle() {
        try {
            const [progRes, winnersRes] = await Promise.all([
                fetch(`${SUPABASE_URL}/rest/v1/raffle_progress?select=*&limit=1`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                }),
                fetch(`${SUPABASE_URL}/rest/v1/winners?select=*&order=created_at.desc&limit=10`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                })
            ]);
            const progressArr = await progRes.json();
            const winners = await winnersRes.json();
            return { progress: progressArr[0] || null, winners };
        } catch(e) {
            return { progress: null, winners: [] };
        }
    }

    purchaseBtn.onclick = async () => {
        if (!validateUsername()) return;
        if (quantity < 50) { alert('Минимальное количество звёзд: 50'); return; }
        
        const recipient = '@' + usernameInput.value.trim();
        const old = document.querySelector('.modal-overlay');
        if (old) old.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card">
                <h3>🛒 Подтверждение заказа</h3>
                <p>Вы действительно хотите купить <strong>${quantity}</strong> звёзд за <strong>${formatPrice(quantity * RUB_PER_STAR)}</strong>?</p>
                <div class="modal-buttons" id="modalButtons">
                    <button class="modal-btn cancel">Отмена</button>
                    <button class="modal-btn confirm" id="confirmBtn">Создание платежа...</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.cancel').onclick = () => modal.remove();
        
        try {
            const data = await createLavaPayment(quantity * RUB_PER_STAR, quantity, recipient);
            if (data.success && data.confirmation_url) {
                const confirmBtn = modal.querySelector('#confirmBtn');
                confirmBtn.outerHTML = `
                    <a href="${data.confirmation_url}" target="_blank" rel="noopener noreferrer"
                       class="modal-btn confirm"
                       style="text-decoration:none;display:flex;align-items:center;justify-content:center;">
                       Перейти к оплате
                    </a>
                `;
            } else {
                alert('Ошибка: ' + (data.error || 'Не удалось создать платёж'));
                modal.remove();
            }
        } catch (err) {
            alert('Ошибка соединения: ' + err.message);
            modal.remove();
        }
    };

    // Нижнее меню
    document.querySelectorAll('.bottom-nav__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bottom-nav__btn').forEach(b => b.classList.remove('bottom-nav__btn--active'));
            btn.classList.add('bottom-nav__btn--active');
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(btn.dataset.screen).classList.add('active');
            
            if (btn.dataset.screen === 'screen-ref') updateRefUI();
            if (btn.dataset.screen === 'screen-raffle') {
                loadRaffle().then(({ progress, winners }) => {
                    const totalStars = progress?.total_stars || 0;
                    const threshold = progress?.threshold || 10000;
                    const pct = Math.min(100, Math.round((totalStars / threshold) * 100));
                    const progressFill = document.getElementById('progressFill');
                    if (progressFill) {
                        progressFill.style.width = pct + '%';
                        progressFill.textContent = pct + '%';
                    }
                    document.getElementById('raffleProgress').textContent = totalStars;
                    const winnersList = document.getElementById('winnersList');
                    if (winnersList) {
                        winnersList.innerHTML = winners.length ? winners.map(w => `
                            <div class="winner-item">
                                <span class="medal">⭐</span>
                                <div>
                                    <div class="name">@${w.username}</div>
                                    <div style="color:var(--text-quaternary);font-size:11px;">${new Date(w.created_at).toLocaleString('ru-RU')}</div>
                                </div>
                                <span class="prize" style="margin-left:auto;">+${w.prize}⭐</span>
                            </div>
                        `).join('') : '<p style="color:var(--text-quaternary);font-size:13px;text-align:center;">Розыгрышей пока не было</p>';
                    }
                });
            }
        });
    });

    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') purchaseBtn.click(); });
    document.addEventListener('click', (e) => {
        if (e.target !== usernameInput && e.target !== starCountInput && !e.target.closest('.quantity__btn')) {
            usernameInput?.blur();
            starCountInput?.blur();
        }
    });

    updateUI();
    updateRefUI();
})();