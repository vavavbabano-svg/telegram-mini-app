(function() {
    const RUB_PER_STAR = 1.45;
    let quantity = 100;
    let tg = null;
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    const usernameInput = document.getElementById('username');
    const starCountInput = document.getElementById('star-count');
    const summaryQty = document.getElementById('summaryQty');
    const totalPriceSpan = document.getElementById('totalPrice');
    const btnText = document.getElementById('btnText');
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const purchaseBtn = document.getElementById('purchaseBtn');
    const usernameCard = document.getElementById('usernameCard');
    const usernamePreview = document.getElementById('usernamePreview');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

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

// Показ имени при вводе username
usernameInput.addEventListener('input', () => {
    usernameCard.style.borderColor = '';
    const val = usernameInput.value.trim();
    
    if (val.length > 0) {
        const ownUsername = tg?.initDataUnsafe?.user?.username;
        const ownFirstName = tg?.initDataUnsafe?.user?.first_name;
        
        if (ownUsername && val.toLowerCase() === ownUsername.toLowerCase() && ownFirstName) {
            userName.textContent = ownFirstName;
        } else {
            userName.textContent = '@' + val;
        }
        
        // Принудительно показываем
        usernamePreview.style.display = 'flex';
    } else {
        usernamePreview.style.display = 'none';
    }
});

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

    function showConfirmModal(onConfirm) {
        const old = document.querySelector('.modal-overlay');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card">
                <h3>🛒 Подтверждение заказа</h3>
                <p>Вы действительно хотите купить <strong>${quantity}</strong> звёзд за <strong>${formatPrice(quantity * RUB_PER_STAR)}</strong>?</p>
                <div class="modal-buttons">
                    <button class="modal-btn cancel">Отмена</button>
                    <button class="modal-btn confirm">Подтвердить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.cancel').onclick = () => modal.remove();
        modal.querySelector('.confirm').onclick = () => { modal.remove(); onConfirm(); };
    }

    function setButtonLoading(loading) {
        purchaseBtn.disabled = loading;
        purchaseBtn.innerHTML = loading 
            ? '<span class="loader-icon"></span> Создание платежа...'
            : `<img src="img/R.png" width="20" height="20"> <span>Купить ${quantity} звёзд</span> <img src="img/R.png" width="20" height="20">`;
    }

    async function createLavaPayment(amount, stars, recipient) {
        const res = await fetch('https://lava-api.vavavbabano.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, description: `Покупка ${stars} звёзд для ${recipient}`, orderId: `order_${Date.now()}`, username: recipient, stars })
        });
        return res.json();
    }

    purchaseBtn.onclick = async () => {
        if (!validateUsername()) return;
        if (quantity < 50) { alert('Минимальное количество звёзд: 50'); return; }
        
        const recipient = '@' + usernameInput.value.trim();
        
        showConfirmModal(async () => {
            setButtonLoading(true);
            try {
                const data = await createLavaPayment(quantity * RUB_PER_STAR, quantity, recipient);
                if (data.success && data.confirmation_url) window.location.href = data.confirmation_url;
                else { alert('Ошибка: ' + (data.error || 'Не удалось создать платёж')); setButtonLoading(false); }
            } catch (err) {
                alert('Ошибка соединения: ' + err.message);
                setButtonLoading(false);
            }
        });
    };

    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') purchaseBtn.click(); });
    
    document.addEventListener('click', (e) => {
        if (e.target !== usernameInput && e.target !== starCountInput && !e.target.closest('.quantity__btn')) {
            usernameInput?.blur();
            starCountInput?.blur();
        }
    });

    updateUI();
})();