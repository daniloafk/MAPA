/* ==========================================================
   routing.js — Planejamento, otimização e desenho de rotas
========================================================== */

import { getMap } from "/js/map.js";
import { appState, toggleClearButton, updateStatusBar, lockUI, unlockUI, resetUIState } from "/js/app.js";
import { showToast } from "/js/utils.js";

/* ==========================================================
   VARIÁVEIS GLOBAIS
========================================================== */
let routePolyline = null;
let routeMarkers = [];

/* ==========================================================
   INICIAR PLANEJAMENTO DE ROTA
========================================================== */
export async function beginRoutePlanning() {

    // Posição atual do usuário armazenada pelo GPS no localStorage (app_state)
    const gpsData = JSON.parse(localStorage.getItem("gps_last_position") || "null");

    if (!gpsData) {
        showToast("Localização ainda não detectada.", "warning");
        return;
    }

    const userPos = {
        lat: gpsData.lat,
        lng: gpsData.lng
    };

    // Buscar lista de clientes
    const list = JSON.parse(localStorage.getItem("clients") || "[]");

    if (list.length === 0) {
        showToast("Nenhum cliente cadastrado para criar rota.", "warning");
        return;
    }

    lockUI();
    updateStatusBar("Gerando rota otimizada...", true);

    try {
        const waypoints = list.map(c => ({
            lat: c.lat,
            lng: c.lng,
            name: c.name
        }));

        const fullRoute = await generateOptimizedRoute(userPos, waypoints);

        drawRoute(fullRoute);
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
async function generateOptimizedRoute(start, clients) {

    // Para muitos pontos → Fleet Routing API (Cloudflare)
    if (clients.length > 10) {
        return await callFleetRoutingAPI(start, clients);
    }

    // Poucos clientes → Directions API
    return await callDirectionsAPI(start, clients);
}

/* ==========================================================
   CLOUDLFARE → FLEET ROUTING API
========================================================== */
async function callFleetRoutingAPI(start, clients) {
    const payload = {
        origin: start,
        clients
    };

    const response = await fetch("/api/optimize-route", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
        throw new Error("Erro ao chamar otimização de rota");
    }

    const data = await response.json();

    return data.route;
}

/* ==========================================================
   DIRECTIONS API (rota pequena)
========================================================== */
async function callDirectionsAPI(start, clients) {

    const waypoints = clients.map(c => ({
        location: { lat: c.lat, lng: c.lng },
        stopover: true
    }));

    const url =
        `https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyApaDb9rSw2sNTaY7fjBqmrgjWYD9xwjcU`;

    const payload = {
        origin: start,
        destination: waypoints[waypoints.length - 1].location,
        waypoints: waypoints.slice(0, -1).map(w => w.location),
        travelMode: "DRIVING",
        optimizeWaypoints: true
    };

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.routes?.length) {
        throw new Error("Directions API não retornou rotas");
    }

    const points = data.routes[0].overview_polyline.points;

    return google.maps.geometry.encoding.decodePath(points);
}

/* ==========================================================
   DESENHAR ROTA NO MAPA
========================================================== */
function drawRoute(path) {
    const map = getMap();

    clearCurrentRoute();

    routePolyline = new google.maps.Polyline({
        map,
        path,
        strokeColor: "#4285f4",
        strokeWeight: 6,
        strokeOpacity: 0.9
    });

    addRouteMarkers(path);
    centerRoute(path);
}

/* ==========================================================
   MARCADORES DE INÍCIO E FIM
========================================================== */
function addRouteMarkers(path) {
    const map = getMap();

    const start = path[0];
    const end = path[path.length - 1];

    const startMarker = new google.maps.Marker({
        map,
        position: start,
        icon: {
            url: "https://maps.google.com/mapfiles/kml/paddle/grn-circle.png",
            scaledSize: new google.maps.Size(42, 42)
        }
    });

    const endMarker = new google.maps.Marker({
        map,
        position: end,
        icon: {
            url: "https://maps.google.com/mapfiles/kml/paddle/red-circle.png",
            scaledSize: new google.maps.Size(42, 42)
        }
    });

    routeMarkers.push(startMarker, endMarker);
}

/* ==========================================================
   CENTRALIZAR MAPA NA ROTA
========================================================== */
function centerRoute(path) {
    const map = getMap();
    const bounds = new google.maps.LatLngBounds();

    path.forEach(p => bounds.extend(p));

    map.fitBounds(bounds);
}

/* ==========================================================
   LIMPAR ROTA
========================================================== */
export function clearCurrentRoute() {

    if (routePolyline) {
        routePolyline.setMap(null);
        routePolyline = null;
    }

    routeMarkers.forEach(m => m.setMap(null));
    routeMarkers = [];

    toggleClearButton(false);
    resetUIState();
    updateStatusBar("Rota removida", false);
}