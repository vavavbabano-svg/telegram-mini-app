(function() {
    'use strict';
    
    const RUB_PER_STAR = 1.45;
    const MIN_QUANTITY = 50;
    const MAX_QUANTITY = 999999;
    const STEP = 10;
    
    let quantity = 100;
    let isLoading = false;
    
    // Кэшируем DOM элементы
    const $ = (id) => document.getElementById(id);
    const usernameInput = $('username');
    const starCountInput = $('star-count');
    const summaryQty = $('summaryQty');
    const totalPriceSpan = $('totalPrice');
    const btnText = $('btnText');
    const btnMinus = $('btnMinus');
    const btnPlus = $('btnPlus');
    const purchaseBtn = $('purchaseBtn');
    const usernameCard = $('usernameCard');
    
    // Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Автозаполнение username
        const user = tg.initDataUnsafe?.user;
        if (user) {
            usernameInput.value = user.username ? `@${user.username}` : `@${user.id}`;
        }
        
        // Полная синхронизация с темой Telegram
        const bgColor = tg.themeParams?.bg_color || '#0F0F11';
        const headerColor = tg.themeParams?.header_bg_color || bgColor;

        document.body.style.backgroundColor = bgColor;
        tg.setHeaderColor(headerColor);
        tg.setBackgroundColor(bgColor);
    }
    
    // Форматирование цены
    const formatPrice = (value) => `${value.toFixed(2).replace('.', ',')} ₽`;
    
    // Единая функция обновления UI
    const updateUI = () => {
        if (starCountInput) starCountInput.value = quantity || '';
        summaryQty.textContent = quantity;
        totalPriceSpan.textContent = formatPrice(quantity * RUB_PER_STAR);
        btnText.textContent = `Купить ${quantity} звёзд`;
        btnMinus?.classList.toggle('quantity__btn--disabled', quantity <= MIN_QUANTITY);
    };
    
    // Изменение количества
    const changeQuantity = (delta) => {
        const newVal = quantity + delta;
        if (newVal < MIN_QUANTITY || newVal > MAX_QUANTITY) return;
        quantity = newVal;
        updateUI();
    };
    
    // Обработка ручного ввода
    const handleInput = () => {
        const raw = starCountInput.value.replace(/\D/g, '').slice(0, 5);
        starCountInput.value = raw;
        quantity = raw === '' ? 0 : Math.min(parseInt(raw) || 0, MAX_QUANTITY);
        updateUI();
    };
    
    // Валидация username
    const validateUsername = () => {
        if (!usernameInput.value.trim()) {
            usernameCard.style.borderColor = 'rgba(239, 68, 68, 0.7)';
            usernameCard.classList.add('shake');
            setTimeout(() => usernameCard.classList.remove('shake'), 600);
            usernameInput.focus();
            return false;
        }
        return true;
    };
    
    // Модальное окно подтверждения
    const showConfirmModal = () => new Promise((resolve) => {
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
        
        modal.querySelector('.cancel').onclick = () => { modal.remove(); resolve(false); };
        modal.querySelector('.confirm').onclick = () => { modal.remove(); resolve(true); };
    });
    
    // Состояние загрузки кнопки
    const setLoading = (loading) => {
        isLoading = loading;
        purchaseBtn.disabled = loading;
        purchaseBtn.innerHTML = loading 
            ? '<span class="loader-icon"></span> Создание платежа...'
            : `<img src="img/R.png" class="button__icon" width="20" height="20"> <span id="btnText">Купить ${quantity} звёзд</span> <img src="img/R.png" class="button__icon" width="20" height="20">`;
    };
    
    // Создание платежа через API
    const createPayment = async (amount, stars, recipient) => {
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
    };
    
    // Обработчик покупки
    const handlePurchase = async () => {
        if (isLoading) return;
        
        const recipient = usernameInput.value.trim() || 'свой аккаунт';
        if (!validateUsername()) return;
        
        if (quantity < MIN_QUANTITY) {
            alert(`Минимальное количество звёзд: ${MIN_QUANTITY}`);
            return;
        }
        
        const confirmed = await showConfirmModal();
        if (!confirmed) return;
        
        setLoading(true);
        try {
            const data = await createPayment(quantity * RUB_PER_STAR, quantity, recipient);
            if (data.success && data.confirmation_url) {
                window.location.href = data.confirmation_url;
            } else {
                alert('Ошибка: ' + (data.error || 'Не удалось создать платёж'));
                setLoading(false);
            }
        } catch (err) {
            alert('Ошибка соединения: ' + err.message);
            setLoading(false);
        }
    };
    
    // Обработчики событий
    btnMinus?.addEventListener('click', () => changeQuantity(-STEP));
    btnPlus?.addEventListener('click', () => changeQuantity(STEP));
    purchaseBtn?.addEventListener('click', handlePurchase);
    
    starCountInput?.addEventListener('input', handleInput);
    starCountInput?.addEventListener('blur', () => { if (!starCountInput.value) { quantity = 0; updateUI(); } });
    starCountInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); starCountInput.blur(); } });
    
    usernameInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') purchaseBtn.click(); });
    usernameInput?.addEventListener('input', () => { usernameCard.style.borderColor = ''; });
    
    // Закрытие клавиатуры
    document.addEventListener('click', (e) => {
        if (e.target !== usernameInput && e.target !== starCountInput && !e.target.closest('.quantity__btn')) {
            usernameInput?.blur();
            starCountInput?.blur();
        }
    });
    // Кнопка "Себе"
const btnSelf = document.getElementById('btnSelf');
let isSelfMode = true; // По умолчанию включено

// Автозаполнение при загрузке
if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const u = tg.initDataUnsafe.user;
    const ownUsername = u.username ? '@' + u.username : '@' + u.id;
    usernameInput.value = ownUsername;
    
    // Сохраняем свой username для переключения
    usernameInput.dataset.ownUsername = ownUsername;
}

// Переключение режима
btnSelf.addEventListener('click', () => {
    isSelfMode = !isSelfMode;
    
    if (isSelfMode) {
        // Включаем "Себе"
        btnSelf.classList.add('self-btn--active');
        btnSelf.textContent = 'Себе';
        usernameInput.value = usernameInput.dataset.ownUsername || '';
        usernameInput.readOnly = true;
    } else {
        // Выключаем "Себе" — можно ввести любой username
        btnSelf.classList.remove('self-btn--active');
        btnSelf.textContent = 'Другу';
        usernameInput.value = '';
        usernameInput.readOnly = false;
        usernameInput.focus();
    }
    
    // Сбрасываем ошибку если была
    usernameCard.style.borderColor = '';
});

// Изначально поле только для чтения
usernameInput.readOnly = true;
    
    // Инициализация
    updateUI();
})();