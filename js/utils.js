/* ==========================================================
   utils.js — Utilitários globais da aplicação
========================================================== */

/* ==========================================================
   TOAST — Sistema de Notificações
========================================================== */

export function showToast(message, type = "info", duration = 3000) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ==========================================================
   DEBOUNCE — Evita chamadas repetidas
========================================================== */
export function debounce(fn, delay = 300) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

/* ==========================================================
   FORMATAÇÃO DE TELEFONE
========================================================== */
export function formatPhone(phone) {
    if (!phone) return "";

    return phone
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{4}).*/, "$1-$2");
}

/* ==========================================================
   GERAR ID ÚNICO
========================================================== */
export function uuid() {
    return crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substr(2));
}

/* ==========================================================
   DELAY (PROMISE)
========================================================== */
export function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

/* ==========================================================
   VALIDAÇÃO RÁPIDA
========================================================== */
export function isEmpty(value) {
    return value === undefined || value === null || value === "";
}