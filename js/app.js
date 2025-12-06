/* ==========================================================
   app.js — Núcleo principal da aplicação
   UI + Inicialização + Liga todos os módulos
========================================================== */

import { initMap, setMapLoaded, toggle3D, centerUserOnMap } from "/js/map.js";
import { startGPS, stopGPS } from "/js/gps.js";
import { initQRClientModal, initQRPackageModal } from "/js/qr.js";
import { loadClientsFromSupabase, renderClientList, handleClientSave } from "/js/clients.js";
import { initSpreadsheetUpload } from "/js/spreadsheet.js";
import { beginRoutePlanning, clearCurrentRoute } from "/js/routing.js";
import { toggleClientMarkers, toggleMatchedMarkers } from "/js/markers.js";
import { showToast } from "/js/utils.js";

/* ==========================================================
   VARIÁVEIS GLOBAIS
========================================================== */
export let appState = {
    map: null,
    gpsActive: false,
    currentRoute: null,
    markersVisible: true,
    matchedVisible: false
};

/* ==========================================================
   INICIALIZAÇÃO PRINCIPAL DO APP (chamada pelo Maps)
========================================================== */
export async function initApp() {
    console.log("💡 Iniciando aplicação...");

    // 1) Inicializar mapa
    appState.map = await initMap();
    console.log("🗺️ Mapa carregado.");

    // 2) Carregar clientes
    await loadClientsFromSupabase();
    renderClientList();

    // 3) GPS
    startGPS(appState.map);
    appState.gpsActive = true;

    // 4) Inicializar modais
    initQRClientModal();
    initQRPackageModal();
    initSpreadsheetUpload();

    // 5) UI
    bindUIEvents();

    // 6) Mostrar controles
    enableUI();

    // 7) Finalizar loading
    finishLoading();
}

/* ==========================================================
   FINALIZA TELA DE LOADING
========================================================== */
function finishLoading() {
    const loading = document.getElementById("loading-screen");
    setTimeout(() => {
        loading.classList.add("hidden");
        setMapLoaded(true);
    }, 300);
}

/* ==========================================================
   MOSTRAR CONTROLES
========================================================== */
function enableUI() {
    document.querySelector(".map-controls")?.classList.add("visible");
    document.getElementById("btnAddClient")?.classList.add("visible");
}

/* ==========================================================
   EVENTOS DA INTERFACE
========================================================== */
function bindUIEvents() {

    document.getElementById("btn3D").onclick = toggle3D;

    document.getElementById("btnCenter").onclick = centerUserOnMap;

    document.getElementById("btnRoute").onclick = beginRoutePlanning;

    document.getElementById("btnClear").onclick = clearCurrentRoute;

    document.getElementById("btnSidebar").onclick = openSidebar;

    document.getElementById("btnSpreadsheet").onclick = () =>
        openModal("modal-spreadsheet");

    document.getElementById("btnToggleClients").onclick = toggleClientMarkers;

    document.getElementById("btnMatchedClients").onclick = toggleMatchedMarkers;

    document.getElementById("btnAddClient").onclick = () =>
        openModal("modal-client");

    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.onclick = () => closeModal(btn.closest(".modal").id);
    });

    document.getElementById("sidebar-overlay").onclick = closeSidebar;

    document.getElementById("sidebar-close").onclick = closeSidebar;

    document.getElementById("client-form").onsubmit = handleClientSave;

    document.getElementById("btnPackageClose").onclick = () =>
        closeModal("modal-package");

    showToast("Aplicação carregada com sucesso!", "success", 2500);
}

/* ==========================================================
   SIDEBAR
========================================================== */
export function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebar-overlay").classList.add("active");
}

export function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebar-overlay").classList.remove("active");
}

/* ==========================================================
   MODAIS
========================================================== */
export function openModal(id) {
    closeSidebar();
    document.getElementById(id).classList.add("active");
}

export function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

/* ==========================================================
   STATUS BAR
========================================================== */
export function updateStatusBar(text, active = true) {
    const bar = document.getElementById("status-bar");
    const indicator = document.getElementById("status-indicator");
    const label = document.getElementById("status-text");

    label.textContent = text;

    if (active) {
        indicator.classList.remove("inactive");
    } else {
        indicator.classList.add("inactive");
    }

    bar.classList.add("visible");
}

/* ==========================================================
   UI GLOBAL
========================================================== */
export function toggleClearButton(show) {
    document.getElementById("btnClear").classList.toggle("hidden", !show);
}

export function lockUI() {
    document.querySelectorAll("button").forEach(b => b.disabled = true);
}

export function unlockUI() {
    document.querySelectorAll("button").forEach(b => b.disabled = false);
}

export function resetUIState() {
    toggleClearButton(false);
}

/* ==========================================================
   DEBUG
========================================================== */
export function debug(msg) {
    console.log("🐞 DEBUG:", msg);
}