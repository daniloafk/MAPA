/* ==========================================================
   routing.js — Rotas Otimizadas (VERSÃO FINAL)
========================================================== */

import { getMap } from "./map.js";
import { appState, toggleClearButton, updateStatusBar, lockUI, unlockUI, resetUIState } from "./app.js";
import { showToast } from "./utils.js";

/* ==========================================================
   VARIÁVEIS GLOBAIS
========================================================== */
let directionsService = null;
let directionsRenderer = null;

/* ==========================================================
   INICIAR PLANEJAMENTO DE ROTA
========================================================== */
export async function beginRoutePlanning() {

    if (!appState.lastGPS) {
        showToast("Localização ainda não detectada.", "warning");
        return;
    }

    const origin = {
        lat: appState.lastGPS.lat,
        lng: appState.lastGPS.lng
    };

    // Buscar clientes carregados
    const list = JSON.parse(localStorage.getItem("clients") || "[]");

    if (list.length === 0) {
        showToast("Nenhum cliente cadastrado para criar rota.", "warning");
        return;
    }

    lockUI();
    updateStatusBar("Gerando rota otimizada...", true);

    try {
        const route = await generateOptimizedRoute(origin, list);
        drawRoute(route);

        toggleClearButton(true);
        updateStatusBar("Rota pronta", true);
        showToast("Rota gerada com sucesso!", "success", 2500);

    } catch (err) {
        console.error(err);
        showToast("Falha ao gerar rota.", "error");
    }

    unlockUI();
}

/* ==========================================================
   GERAR ROTA OTIMIZADA
========================================================== */
async function generateOptimizedRoute(origin, clients) {

    directionsService = new google.maps.DirectionsService();

    const waypoints = clients.map(c => ({
        location: { lat: c.lat, lng: c.lng },
        stopover: true
    }));

    return new Promise((resolve, reject) => {

        directionsService.route(
            {
                origin: origin,
                destination: waypoints[waypoints.length - 1].location,
                waypoints: waypoints.slice(0, -1),
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: true
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    resolve(result);
                } else {
                    reject("Google Directions falhou: " + status);
                }
            }
        );
    });
}

/* ==========================================================
   DESENHAR ROTA NO MAPA
========================================================== */
function drawRoute(result) {
    const map = getMap();

    clearCurrentRoute(); // remove rota anterior

    directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        preserveViewport: false,
        polylineOptions: {
            strokeColor: "#4285f4",
            strokeWeight: 6,
            strokeOpacity: 0.9
        }
    });

    directionsRenderer.setDirections(result);
}

/* ==========================================================
   LIMPAR ROTA
========================================================== */
export function clearCurrentRoute() {

    if (directionsRenderer) {
        directionsRenderer.setMap(null);
        directionsRenderer = null;
    }

    toggleClearButton(false);
    resetUIState();

    updateStatusBar("Rota removida", false);
}