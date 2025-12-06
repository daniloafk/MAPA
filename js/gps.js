/* ==========================================================
   gps.js — Rastreamento de localização em tempo real
========================================================== */

import { updateStatusBar } from "./app.js";
import { updateUserPosition } from "./map.js";

let watchId = null;
let lastPosition = null;

/* ==========================================================
   INICIAR GPS
========================================================== */
export function startGPS(map) {
    if (!navigator.geolocation) {
        updateStatusBar("GPS não suportado no dispositivo", false);
        return;
    }

    updateStatusBar("Ativando GPS...", true);

    watchId = navigator.geolocation.watchPosition(
        pos => {
            const { latitude, longitude } = pos.coords;

            lastPosition = { lat: latitude, lng: longitude };

            updateUserPosition(latitude, longitude);

            updateStatusBar("GPS ativo", true);
        },
        err => {
            console.warn("Erro no GPS:", err.message);
            updateStatusBar("Erro ao acessar GPS", false);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 7000
        }
    );
}

/* ==========================================================
   PARAR GPS
========================================================== */
export function stopGPS() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    updateStatusBar("GPS pausado", false);
}

/* ==========================================================
   OBTÉM A ÚLTIMA LOCALIZAÇÃO CONHECIDA
========================================================== */
export function getLastPosition() {
    return lastPosition;
}