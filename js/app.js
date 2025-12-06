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
    console.log("🚀 Iniciando aplicação...");

    try {
        // 1) Atualizar mensagem de loading
        updateLoadingText("Carregando mapa...");

        // 2) Inicializar mapa
        appState.map = await initMap();
        console.log("✅ Mapa carregado");

        // 3) Atualizar loading
        updateLoadingText("Carregando clientes...");

        // 4) Carregar clientes
        await loadClientsFromSupabase();
        renderClientList();
        console.log("✅ Clientes carregados");

        // 5) Iniciar GPS
        updateLoadingText("Ativando GPS...");
        startGPS(appState.map);
        appState.gpsActive = true;
        console.log("✅ GPS ativado");

        // 6) Inicializar modais
        initQRClientModal();
        initQRPackageModal();
        initSpreadsheetUpload();
        console.log("✅ Modais inicializados");

        // 7) UI
        bindUIEvents();
        console.log("✅ Eventos vinculados");

        // 8) Mostrar controles
        enableUI();

        // 9) Finalizar loading
        finishLoading();

        console.log("🎉 Aplicação iniciada com sucesso!");

    } catch (error) {
        console.error("❌ Erro ao inicializar aplicação:", error);
        showLoadingError("Erro ao carregar aplicação: " + error.message);
    }
}

/* ==========================================================
   ATUALIZAR TEXTO DO LOADING
========================================================== */
function updateLoadingText(text) {
    const loadingText = document.getElementById("loading-text");
    if (loadingText) {
        loadingText.textContent = text;
    }
}

/* ==========================================================
   MOSTRAR ERRO NO LOADING
========================================================== */
function showLoadingError(message) {
    const loading = document.getElementById("loading-screen");
    const content = loading.querySelector(".loading-content");

    content.innerHTML = `
        <div style="color: #ff4444; font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <div style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 10px;">
            Erro ao Carregar
        </div>
        <div style="font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 20px;">
            ${message}
        </div>
        <button onclick="location.reload()" style="
            background: white;
            color: #667eea;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        ">
            Recarregar Página
        </button>
    `;
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
    document.getElementById("status-bar")?.classList.add("visible");
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

    document.getElementById("btnScanPackage").onclick = () =>
        openModal("modal-package");

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
