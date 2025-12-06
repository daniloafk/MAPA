/* ======================================================================
   gps.js — GPS Ultra Preciso com:
   - Alta precisão ativada
   - Média móvel
   - Filtro de Kalman 2D
   - Dead Reckoning
   - Fusão com sensores (acelerômetro + bússola)
   - Detecção de saltos ("anti-drift")
====================================================================== */

import { showToast } from "./utils.js";
import { getMap } from "./map.js";

let gpsMarker = null;
let watchId = null;

// Histórico para média móvel e detecção de ruido
let lastPositions = [];

// Dead reckoning
let lastTimestamp = 0;
let lastSpeed = 0;
let lastHeading = 0;

// Dados de sensores
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
    if (!navigator.geolocation) {
        showToast("Geolocalização não suportada", "error");
        return;
    }

    if (watchId) stopGPS();

    // Sensores
    startSensors();

    watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        GEO_OPTIONS
    );

    showToast("GPS Iniciado com precisão máxima", "success");
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

    if (accuracy > 20) return; // ignora leituras muito ruins

    if (accuracy > 10) {
        showToast("GPS com baixa precisão (> 10m)", "warning", 1000);
    }

    const timestamp = pos.timestamp;

    const rawPos = {
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp
    };

    // 1. Filtra saltos bruscos
    const stablePos = driftFilter(rawPos);
    if (!stablePos) return;

    // 2. Guarda histórico
    lastPositions.push(stablePos);
    if (lastPositions.length > 10) lastPositions.shift();

    // 3. Média móvel
    const smoothed = movingAverage(lastPositions);

    // 4. Kalman 2D
    const kalmanPos = kalmanFilter(smoothed);

    // 5. Dead Reckoning (movimento estimado)
    const finalPos = deadReckoning(kalmanPos, speed, heading, timestamp);

    updateMarker(finalPos);
}

/* ======================================================================
   FILTRO DE DRIFT (anti saltos)
====================================================================== */
function driftFilter(pos) {
    if (lastPositions.length === 0) return pos;

    const last = lastPositions[lastPositions.length - 1];
    const d = distance(last.lat, last.lng, pos.lat, pos.lng);

    if (d > 50) return null; // salto suspeito

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

    const R = 0.00001; // ruído de medição
    const Q = 0.0000001; // ruído de processo

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

/* ======================================================================
   DEAD RECKONING — estimativa de movimento entre medições
====================================================================== */
function deadReckoning(pos, gpsSpeed, gpsHeading, timestamp) {
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        return pos;
    }

    const dt = (timestamp - lastTimestamp) / 1000;

    lastTimestamp = timestamp;

    // Usa heading do compass se existir (mais estável)
    const heading = compassHeading ?? gpsHeading ?? lastHeading;

    if (heading != null) lastHeading = heading;

    const speed = gpsSpeed ?? lastSpeed;
    lastSpeed = speed || 0;

    if (!speed || speed < 0.2) return pos;

    const distanceMeters = speed * dt;

    const headingRad = heading * (Math.PI / 180);

    const newLat = pos.lat + (distanceMeters * Math.cos(headingRad)) / 111111;
    const newLng = pos.lng + (distanceMeters * Math.sin(headingRad)) / (111111 * Math.cos(pos.lat * Math.PI/180));

    return { lat: newLat, lng: newLng };
}

/* ======================================================================
   SENSORES — Compass + Acelerômetro
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
   ATUALIZA MARCADOR NO MAPA
====================================================================== */
function updateMarker(pos) {
    const map = getMap();
    if (!map) return;

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

/* ======================================================================
   FUNÇÕES AUXILIARES
====================================================================== */
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1*Math.PI/180) *
        Math.cos(lat2*Math.PI/180) *
        Math.sin(dLon/2) *
        Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function handleError(err) {
    showToast("Erro de GPS: " + err.message, "error");
}