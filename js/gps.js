/* ======================================================================
   gps.js — GPS Ultra Preciso com:
   - Alta precisão ativada
   - Média móvel
   - Filtro de Kalman 2D
   - Dead Reckoning
   - Fusão com sensores
   - Anti-drift
====================================================================== */

import { showToast } from "/js/utils.js";
import { getMap, updateUserPosition } from "/js/map.js";

let gpsMarker = null;
let watchId = null;

let lastPositions = [];
let lastTimestamp = 0;
let lastSpeed = 0;
let lastHeading = 0;

let compassHeading = null;
let accelerationVector = { x: 0, y: 0, z: 0 };

/* ======================================================================
   CONFIGURAÇÃO DO GPS
====================================================================== */
const GEO_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 20000
};

/* ======================================================================
   INICIAR GPS
====================================================================== */
export function startGPS() {
    console.log("🛰️ Iniciando GPS...");

    if (!navigator.geolocation) {
        showToast("Geolocalização não suportada", "error");
        console.error("❌ Geolocalização não disponível");
        return;
    }

    if (watchId) stopGPS();

    startSensors();

    watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        GEO_OPTIONS
    );

    console.log("✅ GPS iniciado");
    showToast("GPS Iniciado", "success", 1500);
}

/* ======================================================================
   PARAR GPS
====================================================================== */
export function stopGPS() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    stopSensors();
}

/* ======================================================================
   TRATAMENTO DE POSIÇÃO
====================================================================== */
function handlePosition(pos) {
    const { latitude, longitude, accuracy, speed, heading } = pos.coords;

    console.log(`📍 GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy.toFixed(1)}m)`);

    // Salvar última posição no localStorage para uso em rotas
    localStorage.setItem("gps_last_position", JSON.stringify({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: pos.timestamp
    }));

    // Aceitar posições com precisão razoável
    if (accuracy > 50) {
        console.warn("⚠️ Baixa precisão GPS:", accuracy, "m");
        return;
    }

    const rawPos = {
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: pos.timestamp
    };

    const stablePos = driftFilter(rawPos);
    if (!stablePos) return;

    lastPositions.push(stablePos);
    if (lastPositions.length > 10) lastPositions.shift();

    const avg = movingAverage(lastPositions);
    const kalman = kalmanFilter(avg);
    const finalPos = deadReckoning(kalman, speed, heading, pos.timestamp);

    // Atualizar marcador no mapa
    updateUserPosition(finalPos.lat, finalPos.lng);
}

/* ======================================================================
   FILTRO "ANTI-DERIVA"
====================================================================== */
function driftFilter(pos) {
    if (lastPositions.length === 0) return pos;

    const last = lastPositions[lastPositions.length - 1];
    const d = distance(last.lat, last.lng, pos.lat, pos.lng);

    if (d > 100) {
        console.warn("⚠️ Salto muito grande detectado:", d.toFixed(1), "m");
        return null;
    }

    return pos;
}

/* ======================================================================
   MÉDIA MÓVEL
====================================================================== */
function movingAverage(list) {
    const n = list.length;
    const sum = list.reduce((acc, p) => ({
        lat: acc.lat + p.lat,
        lng: acc.lng + p.lng
    }), { lat: 0, lng: 0 });

    return {
        lat: sum.lat / n,
        lng: sum.lng / n
    };
}

/* ======================================================================
   FILTRO DE KALMAN 2D
====================================================================== */
let kalmanState = { lat: null, lng: null };
let kalmanVariance = 1;

function kalmanFilter(pos) {
    if (!kalmanState.lat) {
        kalmanState = pos;
        return pos;
    }

    const R = 0.00001;
    const Q = 0.0000001;

    kalmanVariance += Q;

    const K = kalmanVariance / (kalmanVariance + R);

    kalmanState.lat += K * (pos.lat - kalmanState.lat);
    kalmanState.lng += K * (pos.lng - kalmanState.lng);

    kalmanVariance *= (1 - K);

    return { lat: kalmanState.lat, lng: kalmanState.lng };
}

/* ======================================================================
   DEAD RECKONING
====================================================================== */
function deadReckoning(pos, gpsSpeed, gpsHeading, timestamp) {
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        return pos;
    }

    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    const heading = compassHeading ?? gpsHeading ?? lastHeading;
    if (heading != null) lastHeading = heading;

    const speed = gpsSpeed ?? lastSpeed;
    lastSpeed = speed || 0;

    if (!speed || speed < 0.2) return pos;

    const meters = speed * dt;

    const rad = heading * (Math.PI / 180);

    const newLat = pos.lat + (meters * Math.cos(rad)) / 111111;
    const newLng = pos.lng + (meters * Math.sin(rad)) /
        (111111 * Math.cos(pos.lat * Math.PI/180));

    return { lat: newLat, lng: newLng };
}

/* ======================================================================
   SENSORES
====================================================================== */
function startSensors() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", evt => {
            if (evt.alpha != null) {
                compassHeading = 360 - evt.alpha;
            }
        });
    }

    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", evt => {
            accelerationVector = evt.acceleration ?? accelerationVector;
        });
    }
}

function stopSensors() {
    window.removeEventListener("deviceorientation", () => {});
    window.removeEventListener("devicemotion", () => {});
}

/* ======================================================================
   UTILS
====================================================================== */
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function handleError(err) {
    console.error("❌ Erro GPS:", err);
    showToast("Erro de GPS: " + err.message, "error");
}
