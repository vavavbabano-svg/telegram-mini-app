(function() {
    // ---------- КОНФИГ ----------
    const RUB_PER_STAR = 1.45;
    let quantity = 100;
    let tg = null;
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    // ========== СИНХРОНИЗАЦИЯ ТОЛЬКО ВЕРХНЕЙ ПЛАШКИ ==========
    if (tg) {
        const headerColor = tg.themeParams.header_bg_color || '#0F0F11';
        tg.setHeaderColor(headerColor);
        // Не меняем фон body – он остаётся из styles.css
    }

    // DOM элементы
    const usernameInput = document.getElementById('username');
    const starCountInput = document.getElementById('star-count');
    const summaryQty = document.getElementById('summaryQty');
    const totalPriceSpan = document.getElementById('totalPrice');
    const btnText = document.getElementById('btnText');
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const purchaseBtn = document.getElementById('purchaseBtn');
    const usernameCard = document.getElementById('usernameCard');

    // Telegram — автозаполнение username
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const u = tg.initDataUnsafe.user;
        usernameInput.value = u.username ? '@' + u.username : '@' + u.id;
    }

    function formatPrice(value) {
        return value.toFixed(2).replace('.', ',') + ' ₽';
    }

    function updateAll() {
        if (starCountInput) starCountInput.value = quantity === 0 ? '' : quantity;
        summaryQty.innerText = quantity;
        const total = quantity * RUB_PER_STAR;
        totalPriceSpan.innerText = formatPrice(total);
        btnText.innerText = `Купить ${quantity} звёзд`;
        if (btnMinus) {
            if (quantity <= 10) {
                btnMinus.classList.add('quantity__btn--disabled');
            } else {
                btnMinus.classList.remove('quantity__btn--disabled');
            }
        }
    }

    function changeQuantity(delta) {
        let newVal = quantity + delta;
        if (newVal < 10) return;
        if (newVal > 999999) return;
        quantity = newVal;
        updateAll();
    }

    if (btnMinus) btnMinus.addEventListener('click', () => changeQuantity(-10));
    if (btnPlus) btnPlus.addEventListener('click', () => changeQuantity(10));

    function handleManualInput() {
        if (!starCountInput) return;
        let raw = starCountInput.value.trim();
        let newQuantity;
        if (raw === '') {
            newQuantity = 0;
        } else {
            let val = parseInt(raw);
            if (isNaN(val)) {
                newQuantity = quantity;
            } else {
                newQuantity = val;
            }
        }
        if (newQuantity < 0) newQuantity = 0;
        if (newQuantity > 999999) newQuantity = 999999;
        
        if (quantity !== newQuantity) {
            quantity = newQuantity;
            updateAll();
        }
    }

    if (starCountInput) {
        starCountInput.addEventListener('input', (e) => {
            let val = e.target.value;
            val = val.replace(/[^0-9]/g, '');
            if (val.length > 5) val = val.slice(0, 5);
            e.target.value = val;
            handleManualInput();
        });
        starCountInput.addEventListener('blur', () => {
            if (starCountInput.value === '') {
                quantity = 0;
                updateAll();
            }
        });
        starCountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                starCountInput.blur();
            }
        });
    }

    function validateUsername() {
        const val = usernameInput.value.trim();
        if (!val) {
            usernameCard.style.borderColor = 'rgba(239, 68, 68, 0.7)';
            usernameCard.classList.add('shake');
            setTimeout(() => usernameCard.classList.remove('shake'), 600);
            usernameInput.focus();
            return false;
        }
        usernameCard.style.borderColor = '';
        return true;
    }

    function showConfirmModal(onConfirm) {
        const old = document.querySelector('.modal-overlay');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card">
                <h3>🛒 Подтверждение заказа</h3>
                <p>Вы действительно хотите купить <strong>${quantity}</strong> звёзд за <strong>${(quantity * RUB_PER_STAR).toFixed(2).replace('.',',')} ₽</strong>?</p>
                <div class="modal-buttons">
                    <button class="modal-btn cancel" id="modalCancel">Отмена</button>
                    <button class="modal-btn confirm" id="modalConfirm">Подтвердить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('modalCancel').onclick = () => modal.remove();
        document.getElementById('modalConfirm').onclick = () => {
            modal.remove();
            onConfirm();
        };
    }

    function setButtonLoading(loading) {
        if (loading) {
            purchaseBtn.disabled = true;
            purchaseBtn.innerHTML = '<span class="loader-icon"></span> Создание платежа...';
        } else {
            purchaseBtn.disabled = false;
            purchaseBtn.innerHTML = '<img src="img/R.png" class="button__icon" style="width:20px;height:20px;"> <span id="btnText">Купить ' + quantity + ' звёзд</span> <img src="img/R.png" class="button__icon" style="width:20px;height:20px;">';
        }
    }

    async function createLavaPayment(amount, stars, recipient) {
        const res = await fetch('https://lava-api.vavavbabano.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                description: `Покупка ${stars} звёзд для ${recipient}`,
                orderId: `order_${Date.now()}`,
                username: recipient,
                stars: stars
            })
        });
        return res.json();
    }

    purchaseBtn.onclick = () => {
        let recipient = usernameInput.value.trim();
        if (!recipient) recipient = 'свой аккаунт';
        if (!validateUsername()) return;
        let stars = quantity;
        if (stars <= 0) { alert('Введите количество звёзд (минимум 1)'); return; }
        if (stars < 50) { alert('Минимальное количество звёзд: 50'); return; }

        const totalText = totalPriceSpan.innerText;
        localStorage.setItem('pendingOrder', JSON.stringify({ recipient, stars, total: totalText }));

        showConfirmModal(async () => {
            setButtonLoading(true);
            const amount = quantity * RUB_PER_STAR;
            try {
                const data = await createLavaPayment(amount, stars, recipient);
                if (data.success && data.confirmation_url) {
                    window.location.href = data.confirmation_url;
                } else {
                    alert('Ошибка: ' + (data.error || 'Не удалось создать платёж'));
                    setButtonLoading(false);
                }
            } catch (err) {
                alert('Ошибка соединения: ' + err.message);
                setButtonLoading(false);
            }
        });
    };

    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') purchaseBtn.click();
        });
    }

    document.addEventListener('click', (e) => {
        const isUsernameInput = e.target === usernameInput;
        const isStarCountInput = e.target === starCountInput;
        const isQuantityBtn = e.target.closest('.quantity__btn');
        if (!isUsernameInput && !isStarCountInput && !isQuantityBtn) {
            if (usernameInput) usernameInput.blur();
            if (starCountInput) starCountInput.blur();
        }
    });

    usernameInput.addEventListener('input', () => {
        usernameCard.style.borderColor = '';
    });

    updateAll();
})();