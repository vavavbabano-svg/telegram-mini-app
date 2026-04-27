// api/create-payment.js
export default async function handler(req, res) {
    // ... (твои проверки суммы, cors и т.д.)
    // 1. Создаешь платеж в ЮKasse
    // ...
    // 2. Успешный ответ от ЮKassa должен содержать поле `confirmation_url`
    if (data.confirmation && data.confirmation.confirmation_url) {
        // ВАЖНО: нужно вернуть ссылку, которую понимает openInvoice
        return res.status(200).json({
            success: true,
            confirmation_url: data.confirmation.confirmation_url,
            invoice_url: data.confirmation.confirmation_url
        });
    }
}