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

    // Главная функция обновления UI
    function updateUI() {
        quantityDisplay.innerText = quantity;
        if (starCountInput) starCountInput.value = quantity === 0 ? '' : quantity;
        summaryQty.innerText = quantity;
        const total = quantity * RUB_PER_STAR;
        totalPriceSpan.innerText = formatPrice(total);
        btnText.innerText = `Купить ${quantity} звёзд`;
        btnMinus.classList.toggle('quantity__btn--disabled', quantity <= 10);
    }

    // Изменение кнопками +/-
    function changeQuantity(delta) {
        let newVal = quantity + delta;
        if (newVal < 10) return;
        if (newVal > 999999) return;
        quantity = newVal;
        updateUI();
    }

    // Ручной ввод в поле star-count
    function handleManualInput() {
        if (!starCountInput) return;
        let raw = starCountInput.value.trim();
        if (raw === '') {
            quantity = 0;
        } else {
            let val = parseInt(raw);
            if (isNaN(val)) val = 0;
            if (val < 0) val = 0;
            if (val > 999999) val = 999999;
            quantity = val;
        }
        updateUI();
    }

    btnMinus.addEventListener('click', () => changeQuantity(-10));
    btnPlus.addEventListener('click', () => changeQuantity(10));

    // Ограничение на 5 символов и ручной ввод
    if (starCountInput) {
        // Разрешаем только цифры
        starCountInput.addEventListener('input', (e) => {
            let val = e.target.value;
            // Ограничиваем длину 5 символами
            if (val.length > 5) {
                e.target.value = val.slice(0, 5);
            }
            handleManualInput();
        });
        // При потере фокуса, если поле пустое – ставим 0
        starCountInput.addEventListener('blur', () => {
            if (starCountInput.value === '') {
                quantity = 0;
                updateUI();
            }
        });
    }

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

    // Плашка подтверждения
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

    // Lava API
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