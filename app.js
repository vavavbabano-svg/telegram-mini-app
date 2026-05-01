(function() {
    const RUB_PER_STAR = 1.45;
    let quantity = 100;
    let tg = null;
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    const SUPABASE_URL = 'https://naxxslgxyelefzdxjhze.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF';

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
            body: JSON.stringify({ 
                amount, 
                description: `Покупка ${stars} звёзд для ${recipient}`, 
                orderId: `order_${Date.now()}`, 
                username: recipient, 
                stars 
            })
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

    async function savePurchaseAndUpdateRaffle(userId, username, stars, amount, recipient) {
        await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ user_id: userId, username, stars, amount, recipient })
        });

        const getRes = await fetch(`${SUPABASE_URL}/rest/v1/raffle_progress?select=*&limit=1`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const progressArr = await getRes.json();
        const progress = progressArr[0] || { total_stars: 0, threshold: 10000, prize_pool: 500, id: 1 };
        
        let newTotal = progress.total_stars + stars;
        let winner = null;
        
        if (newTotal >= progress.threshold) {
            const buyersRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases?select=username`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const buyers = await buyersRes.json();
            
            if (buyers.length > 0) {
                winner = buyers[Math.floor(Math.random() * buyers.length)].username;
                await fetch(`${SUPABASE_URL}/rest/v1/winners`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    },
                    body: JSON.stringify({ username: winner, prize: progress.prize_pool })
                });
            }
            newTotal = newTotal - progress.threshold;
        }
        
        await fetch(`${SUPABASE_URL}/rest/v1/raffle_progress?id=eq.${progress.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ total_stars: newTotal })
        });
        
        if (winner) {
            alert(`🎉 Розыгрыш! Победитель @${winner} получает ${progress.prize_pool} звёзд!`);
        }
    }

    async function checkPaymentStatus(orderId, userId, username, stars, amount, recipient) {
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 5000));
            try {
                const res = await fetch(`https://lava-api.vavavbabano.workers.dev/status?orderId=${orderId}`);
                const data = await res.json();
                if (data.status === 200 && data.data?.invoice_status === 'paid') {
                    await savePurchaseAndUpdateRaffle(userId, username, stars, amount, recipient);
                    return;
                }
                if (data.data?.invoice_status === 'expired' || data.data?.invoice_status === 'failed') {
                    return;
                }
            } catch(e) {}
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
                const userId = tg?.initDataUnsafe?.user?.id?.toString() || 'anon';
                const username = tg?.initDataUnsafe?.user?.username || '';
                if (data.orderId) {
                    checkPaymentStatus(data.orderId, userId, username, quantity, quantity * RUB_PER_STAR, recipient);
                }
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

    document.querySelectorAll('.bottom-nav__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bottom-nav__btn').forEach(b => b.classList.remove('bottom-nav__btn--active'));
            btn.classList.add('bottom-nav__btn--active');
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(btn.dataset.screen).classList.add('active');
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
})();