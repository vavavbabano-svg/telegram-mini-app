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

    if (!starCountInput || !btnCountSpan || !summaryLabel || !totalPriceSpan || !buyButton) {
        console.error('❌ Элементы не найдены');
        return;
    }

    // --- СИНХРОНИЗАЦИЯ С ВЕРХНЕЙ ПЛАШКОЙ TELEGRAM ---
    function syncTelegramHeader() {
        if (!tg) return;
        
        // Получаем цвет фона шапки из темы Telegram
        const headerColor = tg.themeParams.header_bg_color || tg.themeParams.bg_color || '#0a0a0c';
        // Устанавливаем цвет шапки Telegram
        tg.setHeaderColor(headerColor);
        
        // Дополнительно синхронизируем цвет фона самого приложения
        const bgColor = tg.themeParams.bg_color || '#07070b';
        tg.setBackgroundColor(bgColor);
        
        // Применяем тот же цвет к body (чтобы не было резкого перехода)
        document.body.style.backgroundColor = bgColor;
        
        // Если нужно, можно применить к контейнеру
        const container = document.querySelector('.app-container');
        if (container) {
            container.style.background = `radial-gradient(circle at 100% 0%, rgba(159, 101, 255, 0.12), rgba(0, 0, 0, 0) 70%),
                                        radial-gradient(circle at 0% 100%, rgba(44, 110, 219, 0.08), rgba(0, 0, 0, 0) 70%),
                                        ${bgColor}`;
        }
    }

    // Применяем синхронизацию при загрузке
    if (tg) {
        syncTelegramHeader();
        // Слушаем изменение темы в Telegram (если пользователь переключит)
        tg.onEvent('themeChanged', () => {
            syncTelegramHeader();
            applyTelegramTheme(); // дополнительно обновляем карточки и кнопки
        });
    }

    // Telegram тема для карточек и кнопок
    function applyTelegramTheme() {
        if (!tg) return;
        const bg = tg.themeParams.bg_color || '#0a0a0c';
        const card = tg.themeParams.secondary_bg_color || '#0e0e12';
        const text = tg.themeParams.text_color || '#ffffff';
        const buttonText = tg.themeParams.button_text_color || '#ffffff';
        
        document.body.style.backgroundColor = bg;
        document.body.style.color = text;
        
        const container = document.querySelector('.app-container');
        if (container) {
            container.style.background = `radial-gradient(circle at 100% 0%, rgba(159, 101, 255, 0.12), rgba(0, 0, 0, 0) 70%),
                                        radial-gradient(circle at 0% 100%, rgba(44, 110, 219, 0.08), rgba(0, 0, 0, 0) 70%),
                                        ${card}`;
        }
        
        document.querySelectorAll('.input-group').forEach(el => {
            el.style.backgroundColor = '#0a0a0f';
            el.style.borderColor = '#1e1e2a';
        });
        
        if (buyButton) {
            buyButton.style.background = `linear-gradient(105deg, #3d7eff, #b77eff)`;
            buyButton.style.color = buttonText;
        }
    }

    if (tg) {
        applyTelegramTheme();
    }

    // Автозаполнение username
    if (usernameInput && tg && tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        usernameInput.value = u.username ? '@' + u.username : '@' + u.id;
    }

    // Закрытие по Enter
    starCountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            starCountInput.blur();
        }
    });

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            usernameInput.blur();
        }
    });

    // Обновление цены
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
    starCountInput.addEventListener('blur', () => {
        if (starCountInput.value === '' || starCountInput.value === null) {
            starCountInput.value = 0;
            updateTotal();
        }
    });

    updateTotal();

    // Плашка подтверждения
    function showConfirmModal(onConfirm) {
        const old = document.querySelector('.modal-overlay');
        if (old) old.remove();
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-card">
                <h3>🛒 Подтверждение заказа</h3>
                <p>Вы действительно хотите купить <strong>${starCountInput.value}</strong> звёзд за <strong>${totalPriceSpan.innerText} ₽</strong>?</p>
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
        if (!buyButton) return;
        if (loading) {
            buyButton.disabled = true;
            buyButton.innerHTML = '<span class="loader-icon"></span> Создание платежа...';
        } else {
            buyButton.disabled = false;
            buyButton.innerHTML = '<img src="img/R.png" style="width:18px;height:18px;object-fit:contain;"> Купить ' + starCountInput.value + ' звёзд';
        }
    }

    // Оплата через Lava API
    buyButton.onclick = () => {
        let recipient = usernameInput ? usernameInput.value.trim() : '';
        if (!recipient) recipient = 'свой аккаунт';
        let stars = parseInt(starCountInput.value) || 0;
        if (stars <= 0) { alert('Введите количество звёзд (минимум 1)'); return; }
        if (stars < 50) { alert('Минимальное количество звёзд: 50'); return; }

        const totalText = totalPriceSpan.innerText + ' ₽';
        localStorage.setItem('pendingOrder', JSON.stringify({ recipient, stars, total: totalText }));

        showConfirmModal(async () => {
            setButtonLoading(true);
            const amount = parseFloat(totalPriceSpan.innerText);
            try {
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
                const data = await res.json();
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

    // Supabase user ID
    async function initUser() {
        const tgUser = tg?.initDataUnsafe?.user;
        if (!tgUser) return;
        const tgId = String(tgUser.id);
        let { data: user } = await supabase.from("users").select("number").eq("tg_id", tgId).maybeSingle();
        if (user?.number) {
            const userIdEl = document.createElement('div');
            userIdEl.style.cssText = 'position:fixed; top:10px; left:10px; background:#1c1c1e; padding:4px 12px; border-radius:20px; font-size:12px; z-index:1001;';
            userIdEl.textContent = "#" + String(user.number).padStart(4, "0");
            document.body.appendChild(userIdEl);
        }
    }
    initUser();
});