/* ==========================================================
   gps.js — GPS em alta precisão + filtro de precisão + suavização
========================================================== */

import { showToast } from "./utils.js";
import { getMap } from "./map.js";

let gpsMarker = null;
let watchId = null;
let lastPositions = [];

/* ==========================================================
   CONFIGURAÇÃO DO GPS (otimizada para precisão)
========================================================== */
const GEO_OPTIONS = {
    enableHighAccuracy: true,   // ativa GPS / GNSS completo
    maximumAge: 0,              // não usa cache
    timeout: 20000              // permite tempo para corrigir satélites
};

/* ==========================================================
   INICIAR GPS
========================================================== */
export function startGPS() {
    if (!navigator.geolocation) {
        showToast("Geolocalização não suportada", "error");
        return;
    }

    if (watchId) {
        stopGPS();
    }

    watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        GEO_OPTIONS
    );

    showToast("Localização iniciada (alta precisão)", "info");
}

/* ==========================================================
   PARAR GPS
========================================================== */
export function stopGPS() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

/* ==========================================================
   RECEBE COORDENADAS
========================================================== */
function handlePosition(pos) {
    const map = getMap();
    const { latitude, longitude, accuracy } = pos.coords;

    // Ignorar posições imprecisas
    if (accuracy > 15) return;    // ignora leituras ruins
    if (accuracy > 10) {
        showToast("Sinal fraco (precisão > 10m)", "warning", 800);
    }

    // Armazena para suavização
    lastPositions.push({ lat: latitude, lng: longitude });

    // Mantém média de 5 posições
    if (lastPositions.length > 5) lastPositions.shift();

    const smoothPos = smoothGPS();

    updateMarker(smoothPos, map);
}

/* ==========================================================
   SUAVIZAÇÃO — Média móvel
========================================================== */
function smoothGPS() {
    const len = lastPositions.length;
    if (len === 0) return null;

    const sum = lastPositions.reduce(
        (acc, p) => ({
            lat: acc.lat + p.lat,
            lng: acc.lng + p.lng
        }),
        { lat: 0, lng: 0 }
    );

    return {
        lat: sum.lat / len,
        lng: sum.lng / len
    };
}

/* ==========================================================
   ATUALIZA MARCADOR
========================================================== */
function updateMarker(pos, map) {
    if (!pos) return;

    if (!gpsMarker) {
        gpsMarker = new google.maps.Marker({
            map,
            position: pos,
            icon: {
                url: "/assets/gps-dot.png",
                scaledSize: new google.maps.Size(16, 16)
            }
        });
    } else {
        gpsMarker.setPosition(pos);
    }

    map.panTo(pos);
}

/* ==========================================================
   ERROS DE GPS
========================================================== */
function handleError(err) {
    showToast(`Erro de GPS: ${err.message}`, "error");
}