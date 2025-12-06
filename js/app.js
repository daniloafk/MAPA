/* ==========================================================
   app.js — Núcleo principal da aplicação (VERSÃO FINAL)
   UI + GPS + Inicialização + Liga todos os módulos
========================================================== */

import { initMap, setMapLoaded, toggle3D, centerUserOnMap } from "./map.js";
import { startGPS, stopGPS, onGPSData } from "./gps.js";
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
    gpsActive: true,
    currentRoute: null,
    markersVisible: true,
    matchedVisible: false
};


/* ==========================================================
   INICIALIZAÇÃO PRINCIPAL (Chamado pelo Google Maps)
========================================================== */
export async function initApp() {
    console.log("💡 Iniciando aplicação...");

    // 1) Inicializar mapa
    appState.map = await initMap();
    console.log("🗺️ Mapa carregado.");

    // 2) Carregar clientes
    await loadClientsFromSupabase();
    renderClientList();

    // 3) Iniciar GPS ULTRA PRECISO
    initGPSIntegration();

    // 4) Inicializar modais
    initQRClientModal();
    initQRPackageModal();
    initSpreadsheetUpload();

    // 5) Eventos da UI
    bindUIEvents();

    // 6) Mostrar UI quando tudo pronto
    enableUI();

    // 7) Ocultar loading
    finishLoading();

    showToast("Aplicação carregada com sucesso!", "success", 2500);
}


/* ==========================================================
   INTEGRAÇÃO COMPLETA DO GPS ULTRA PRECISO
========================================================== */
function initGPSIntegration() {
    console.log("📡 Iniciando GPS ultra preciso...");

    startGPS(appState.map);
    appState.gpsActive = true;

    // GPS envia dados continuamente via callback oficial do gps.js
    onGPSData((data) => {
        if (!data) return;

        // Atualiza painel GPS
        document.getElementById("gps-accuracy").textContent = data.accuracy?.toFixed(1) ?? "--";
        document.getElementById("gps-speed").textContent = data.speed?.toFixed(2) ?? "--";
        document.getElementById("gps-heading").textContent = data.heading ?? "--";
        document.getElementById("gps-compass").textContent = data.compass ?? "--";
        document.getElementById("gps-lat").textContent = data.lat?.toFixed(6) ?? "--";
        document.getElementById("gps-lng").textContent = data.lng?.toFixed(6) ?? "--";

        // Atualiza barra de status
        updateStatusBar(
            `Precisão: ${data.accuracy?.toFixed(1) ?? "--"}m`,
            true
        );
    });
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

    /* 3D */
    document.getElementById("btn3D").onclick = () => toggle3D();

    /* Centralizar */
    document.getElementById("btnCenter").onclick = () => centerUserOnMap();

    /* Planejar rota */
    document.getElementById("btnRoute").onclick = () => beginRoutePlanning();

    /* Limpar rota */
    document.getElementById("btnClear").onclick = () => clearCurrentRoute();

    /* Sidebar */
    document.getElementById("btnSidebar").onclick = () => openSidebar();

    /* Modal Planilha */
    document.getElementById("btnSpreadsheet").onclick = () => openModal("modal-spreadsheet");

    /* Marcadores */
    document.getElementById("btnToggleClients").onclick = () => toggleClientMarkers();
    document.getElementById("btnMatchedClients").onclick = () => toggleMatchedMarkers();

    /* Adicionar cliente */
    document.getElementById("btnAddClient").onclick = () => openModal("modal-client");

    /* Fechar modais */
    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.onclick = () => closeModal(btn.closest(".modal").id);
    });

    /* Sidebar overlay */
    document.getElementById("sidebar-overlay").onclick = closeSidebar;

    /* Botão fecha-sidebar */
    document.getElementById("sidebar-close").onclick = closeSidebar;

    /* Salvar cliente */
    document.getElementById("client-form").onsubmit = handleClientSave;

    /* Botão fechar modal de pacote */
    document.getElementById("btnPackageClose").onclick =
        () => closeModal("modal-package");
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
   STATUS BAR (GPS)
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
   BOTÕES GLOBAIS
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
   RESET (após limpar rota)
========================================================== */
export function resetUIState() {
    toggleClearButton(false);
}


/* ==========================================================
   DEBUG
========================================================== */
export function debug(msg) {
    console.log("🐞 DEBUG:", msg);
}