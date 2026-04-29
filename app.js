(function() {
    // ---------- КОНФИГ ----------
    const RUB_PER_STAR = 1.59;
    let quantity = 100;
    let tg = null;
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    // DOM элементы
    const usernameInput = document.getElementById('username');
    const quantityDisplay = document.getElementById('quantityDisplay');
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

    function updateUI() {
        quantityDisplay.innerText = quantity;
        summaryQty.innerText = quantity;
        const total = quantity * RUB_PER_STAR;
        totalPriceSpan.innerText = formatPrice(total);
        btnText.innerText = `Купить ${quantity} звёзд`;
        btnMinus.classList.toggle('quantity__btn--disabled', quantity <= 10);
    }

    function changeQuantity(delta) {
        let newVal = quantity + delta;
        if (newVal < 10) return;
        if (newVal > 999999) return;
        quantity = newVal;
        updateUI();
    }

    btnMinus.addEventListener('click', () => changeQuantity(-10));
    btnPlus.addEventListener('click', () => changeQuantity(10));

    // валидация username
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

    // Плашка подтверждения (как в старом дизайне)
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
            purchaseBtn.innerHTML = '<span class="button__icon">⭐</span> <span id="btnText">Купить ' + quantity + ' звёзд</span> <span class="button__icon">⭐</span>';
            document.getElementById('btnText').innerText = `Купить ${quantity} звёзд`;
        }
    }

    // Lava API (полностью тот же, что работал)
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
        if (!recipient) {
            recipient = 'свой аккаунт';
        }
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

    updateUI();

    // Enter в поле username
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') purchaseBtn.click();
    });
    // сброс ошибки при вводе
    usernameInput.addEventListener('input', () => {
        usernameCard.style.borderColor = '';
    });
})();