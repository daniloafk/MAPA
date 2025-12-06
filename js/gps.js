/* ======================================================================
   gps.js — GPS Ultra Preciso FINAL
   Integrado com app.js + map.js + painel de precisão
====================================================================== */

import { showToast } from "./utils.js";
import { getMap, updateUserPosition } from "./map.js";

/* ==========================================================
   CALLBACKS PARA O app.js
========================================================== */
let gpsCallbacks = [];
export function onGPSData(fn) {
    gpsCallbacks.push(fn);
}

/* ==========================================================
   VARIÁVEIS GERAIS
========================================================== */
let gpsMarker = null;
let watchId = null;

let lastPositions = [];
let lastTimestamp = 0;
let lastSpeed = 0;
let lastHeading = 0;

let compassHeading = null;
let accelerationVector = { x: 0, y: 0, z: 0 };

/* ==========================================================
   CONFIG
========================================================== */
const GEO_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 20000
};

/* ==========================================================
   INICIAR GPS
========================================================== */
export function startGPS() {
    if (!navigator.geolocation) {
        showToast("Geolocalização não suportada", "error");
        return;
    }

    if (watchId) stopGPS();

    startSensors();

    watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        GEO_OPTIONS
    );

    showToast("GPS iniciado com precisão máxima", "success");
}

/* ==========================================================
   PARAR GPS
========================================================== */
export function stopGPS() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    stopSensors();
}

/* ==========================================================
   PROCESSAR POSIÇÃO
========================================================== */
function handlePosition(pos) {
    const { latitude, longitude, accuracy, speed, heading } = pos.coords;

    if (accuracy > 25) return;
    if (accuracy > 10) showToast("GPS com baixa precisão (> 10m)", "warning", 1000);

    const timestamp = pos.timestamp;

    const raw = {
        lat: latitude,
        lng: longitude,
        accuracy,
        speed,
        heading,
        timestamp
    };

    const stable = driftFilter(raw);
    if (!stable) return;

    lastPositions.push(stable);
    if (lastPositions.length > 10) lastPositions.shift();

    const avg = movingAverage(lastPositions);
    const kalman = kalmanFilter(avg);
    const final = deadReckoning(kalman, speed, heading, timestamp);

    updateMarker(final);
    fireCallbacks(final, accuracy, speed, heading);
}

/* ==========================================================
   DISPARAR CALLBACKS PARA app.js
========================================================== */
function fireCallbacks(pos, accuracy, speed, heading) {
    gpsCallbacks.forEach(fn =>
        fn({
            lat: pos.lat,
            lng: pos.lng,
            accuracy: accuracy,
            speed: speed,
            heading: heading ?? compassHeading ?? lastHeading,
            compass: compassHeading ?? null
        })
    );
}

/* ==========================================================
   ANTI‑DRIFT
========================================================== */
function driftFilter(pos) {
    if (lastPositions.length === 0) return pos;

    const last = lastPositions[lastPositions.length - 1];
    const d = distance(last.lat, last.lng, pos.lat, pos.lng);

    if (d > 60) return null; // salto suspeito
    return pos;
}

/* ==========================================================
   MÉDIA MÓVEL
========================================================== */
function movingAverage(list) {
    const n = list.length;
    const sum = list.reduce(
        (a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }),
        { lat: 0, lng: 0 }
    );

    return { lat: sum.lat / n, lng: sum.lng / n };
}

/* ==========================================================
   KALMAN FILTER
========================================================== */
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

    return {
        lat: kalmanState.lat,
        lng: kalmanState.lng
    };
}

/* ==========================================================
   DEAD RECKONING
========================================================== */
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

    const dist = speed * dt;
    const rad = heading * (Math.PI / 180);

    const newLat = pos.lat + (dist * Math.cos(rad)) / 111111;
    const newLng =
        pos.lng +
        (dist * Math.sin(rad)) /
            (111111 * Math.cos(pos.lat * Math.PI / 180));

    return { lat: newLat, lng: newLng };
}

/* ==========================================================
   SENSORES — COMPASS + MOTION
========================================================== */
function startSensors() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", e => {
            if (e.alpha != null) compassHeading = 360 - e.alpha;
        });
    }

    if (window.DeviceMotionEvent) {
        window.addEventListener("devicemotion", e => {
            accelerationVector = e.acceleration ?? accelerationVector;
        });
    }
}

function stopSensors() {
    window.removeEventListener("deviceorientation", () => {});
    window.removeEventListener("devicemotion", () => {});
}

/* ==========================================================
   ATUALIZAR MARCADOR NO MAPA + INTEGRAR COM map.js
========================================================== */
function updateMarker(pos) {
    const map = getMap();
    if (!map) return;

    updateUserPosition(pos.lat, pos.lng, compassHeading);
}

/* ==========================================================
   DISTÂNCIA
========================================================== */
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ==========================================================
   ERRO
========================================================== */
function handleError(err) {
    showToast("Erro de GPS: " + err.message, "error");
}