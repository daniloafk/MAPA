/* ==========================================================
   app.js — Núcleo principal da aplicação
   UI + Inicialização + Liga todos os módulos
========================================================== */

import { initMap, setMapLoaded, toggle3D, centerUserOnMap } from "./map.js";
import { startGPS, stopGPS } from "./gps.js";
import { initQRClientModal, initQRPackageModal } from "./qr.js";
import { loadClientsFromSupabase, renderClientList, handleClientSave } from "./clients.js";
import { initSpreadsheetUpload } from "./spreadsheet.js";
import { beginRoutePlanning, clearCurrentRoute } from "./routing.js";
import { toggleClientMarkers, toggleMatchedMarkers } from "./markers.js";
import { showToast } from "./utils.js";


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
   INICIALIZAÇÃO PRINCIPAL DO APP (chamada pelo Google Maps)
========================================================== */
export async function initApp() {
    console.log("💡 Iniciando aplicação...");

    // 1) Inicializar mapa
    appState.map = await initMap();
    console.log("🗺️ Mapa carregado.");

    // 2) Carregar clientes do Supabase
    await loadClientsFromSupabase();
    renderClientList();

    // 3) Inicializar GPS
    startGPS(appState.map);
    appState.gpsActive = true;

    // 4) Inicializar modais
    initQRClientModal();
    initQRPackageModal();
    initSpreadsheetUpload();

    // 5) Ligar botões da UI
    bindUIEvents();

    // 6) Mostrar controles após tudo carregado
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

    /* --------- Controle: 3D --------- */
    document.getElementById("btn3D").onclick = () => {
        toggle3D();
    };

    /* --------- Centralizar --------- */
    document.getElementById("btnCenter").onclick = () => {
        centerUserOnMap();
    };

    /* --------- Planejar rota --------- */
    document.getElementById("btnRoute").onclick = () => {
        beginRoutePlanning();
    };

    /* --------- Limpar rota --------- */
    document.getElementById("btnClear").onclick = () => {
        clearCurrentRoute();
    };

    /* --------- Mostrar sidebar --------- */
    document.getElementById("btnSidebar").onclick = () => {
        openSidebar();
    };

    /* --------- Abrir planilha --------- */
    document.getElementById("btnSpreadsheet").onclick = () => {
        openModal("modal-spreadsheet");
    };

    /* --------- Alternar marcadores de clientes --------- */
    document.getElementById("btnToggleClients").onclick = () => {
        toggleClientMarkers();
    };

    /* --------- Alternar clientes encontrados --------- */
    document.getElementById("btnMatchedClients").onclick = () => {
        toggleMatchedMarkers();
    };

    /* --------- Abrir modal adicionar cliente --------- */
    document.getElementById("btnAddClient").onclick = () => {
        openModal("modal-client");
    };

    /* --------- Fechar modais --------- */
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.onclick = () => closeModal(btn.closest(".modal").id);
    });

    /* --------- Sidebar overlay --------- */
    document.getElementById("sidebar-overlay").onclick = closeSidebar;

    /* --------- Fechar sidebar --------- */
    document.getElementById("sidebar-close").onclick = closeSidebar;

    /* --------- Salvar cliente --------- */
    document.getElementById("client-form").onsubmit = handleClientSave;

    /* --------- Fechar modal pacote --------- */
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
   ATUALIZAÇÃO DINÂMICA DO STATUS BAR (GPS)
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
   CONTROLE DE BOTÕES GLOBAIS
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


/* ==========================================================
   RESET GLOBAL (usado após limpar rota)
========================================================== */
export function resetUIState() {
    toggleClearButton(false);
}


/* ==========================================================
   DEBUGGER (opcional)
========================================================== */
export function debug(msg) {
    console.log("🐞 DEBUG:", msg);
}