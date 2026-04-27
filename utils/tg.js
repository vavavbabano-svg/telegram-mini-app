// utils/tg.js
// Универсальный модуль для работы и в Telegram, и в браузере

(function() {
    const isTelegram = !!window.Telegram?.WebApp;
    
    // Создаем фейковый объект для браузера
    const createFakeTG = () => {
        const fakeUser = {
            id: 123456789,
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user',
            language_code: 'ru'
        };
        
        return {
            ready: () => console.log('[Сайт] Приложение готово'),
            close: () => {
                console.log('[Сайт] Закрытие');
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/';
            },
            expand: () => console.log('[Сайт] Развернуть'),
            MainButton: {
                show: () => console.log('[Сайт] Показать главную кнопку'),
                hide: () => console.log('[Сайт] Скрыть главную кнопку'),
                setText: (text) => console.log('[Сайт] Текст кнопки:', text),
                setParams: (params) => console.log('[Сайт] Параметры кнопки:', params),
                onClick: (fn) => { window.__fakeMainButtonCallback = fn; },
                offClick: () => { delete window.__fakeMainButtonCallback; }
            },
            BackButton: {
                show: () => console.log('[Сайт] Показать кнопку назад'),
                hide: () => console.log('[Сайт] Скрыть кнопку назад'),
                onClick: (fn) => { window.__fakeBackButtonCallback = fn; }
            },
            HapticFeedback: {
                impactOccurred: (style) => console.log('[Сайт] Вибрация:', style)
            },
            initDataUnsafe: { user: fakeUser },
            initData: 'fake_init_data',
            version: '8.0',
            platform: 'web',
            colorScheme: 'light',
            themeParams: {
                bg_color: '#ffffff',
                text_color: '#000000',
                button_color: '#2c2c2c',
                button_text_color: '#ffffff'
            },
            isTelegram: false
        };
    };
    
    // Реальный Telegram.WebApp или фейк
    const tg = isTelegram ? window.Telegram.WebApp : createFakeTG();
    
    // Если это реальный Telegram — активируем мини-апп
    if (isTelegram) {
        tg.ready();
        tg.expand();
    }
    
    // Делаем глобально доступным
    window.tg = tg;
    window.isTelegram = isTelegram;
    
    console.log('TG Module loaded. Telegram:', isTelegram);
})();