/* ======================================================================
   gps.js — GPS Ultra Preciso com KALMAN 4D REAL (POSIÇÃO + VELOCIDADE)
   Compatível com app.js + map.js
====================================================================== */

import { showToast } from "./utils.js";
import { getMap, updateUserPosition } from "./map.js";

/* ==========================================================
   CALLBACKS DO app.js
========================================================== */
let gpsCallbacks = [];
export function onGPSData(fn) {
    gpsCallbacks.push(fn);
}

/* ==========================================================
   VARIÁVEIS GERAIS
========================================================== */
let watchId = null;

let lastPositions = [];
let lastTimestamp = 0;

let compassHeading = null;
let lastHeading = 0;

/* ==========================================================
   CONFIG
========================================================== */
const GEO_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 20000
};

/* ==========================================================
   KALMAN 4D (x, y, vx, vy)
========================================================== */

let KF = {
    x: [0, 0, 0, 0], // estado: lat, lng, velLat, velLng
    P: [
        [10, 0, 0, 0],
        [0, 10, 0, 0],
        [0, 0, 10, 0],
        [0, 0, 0, 10]
    ],
    Q: [
        [0.000001, 0, 0, 0],
        [0, 0.000001, 0, 0],
        [0, 0, 0.00001, 0],
        [0, 0, 0, 0.00001]
    ],
    R: [
        [0.0001, 0],
        [0, 0.0001]
    ],
    lastTime: null
};

// Multiplicação de matrizes 4x4 × 4x1
function matMul4(A, x) {
    return [
        A[0][0]*x[0] + A[0][1]*x[1] + A[0][2]*x[2] + A[0][3]*x[3],
        A[1][0]*x[0] + A[1][1]*x[1] + A[1][2]*x[2] + A[1][3]*x[3],
        A[2][0]*x[0] + A[2][1]*x[1] + A[2][2]*x[2] + A[2][3]*x[3],
        A[3][0]*x[0] + A[3][1]*x[1] + A[3][2]*x[2] + A[3][3]*x[3]
    ];
}

// Multiplicação de matrizes 4x4 × 4x4
function matMul44(A, B) {
    const R = Array(4).fill(null).map(()=>Array(4).fill(0));
    for (let i=0;i<4;i++){
        for (let j=0;j<4;j++){
            for (let k=0;k<4;k++){
                R[i][j] += A[i][k] * B[k][j];
            }
        }
    }
    return R;
}

// Soma de matrizes 4x4
function matAdd44(A, B) {
    const R = Array(4).fill(null).map(()=>Array(4).fill(0));
    for (let i=0;i<4;i++){
        for (let j=0;j<4;j++){
            R[i][j] = A[i][j] + B[i][j];
        }
    }
    return R;
}

// Subtração vetor 2x1
function vecSub2(a, b){
    return [a[0]-b[0], a[1]-b[1]];
}

// Kalman 4D completo (posição + velocidade)
function kalman4D(measuredPos, gpsSpeed, gpsHeading, timestamp) {

    if (!KF.lastTime) KF.lastTime = timestamp;
    const dt = (timestamp - KF.lastTime)/1000;
    KF.lastTime = timestamp;

    // MATRIZ DE TRANSIÇÃO (F)
    const F = [
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0 ],
        [0, 0, 0, 1 ]
    ];

    // PREDIÇÃO
    KF.x = matMul4(F, KF.x);
    KF.P = matAdd44(matMul44(matMul44(F, KF.P), transpose(F)), KF.Q);

    // MEDIÇÃO DO GPS (z)
    const z = [measuredPos.lat, measuredPos.lng];

    // MATRIZ DE MEDIÇÃO (H)
    const H = [
        [1,0,0,0],
        [0,1,0,0]
    ];

    // Innovation = z - Hx
    const Hx = [KF.x[0], KF.x[1]];
    const y = vecSub2(z, Hx);

    // S = HPHᵀ + R (2x2)
    const S = [
        [
            KF.P[0][0] + KF.R[0][0],
            KF.P[0][1] + KF.R[0][1]
        ],
        [
            KF.P[1][0] + KF.R[1][0],
            KF.P[1][1] + KF.R[1][1]
        ]
    ];

    // Inverso de matriz 2x2
    const det = S[0][0]*S[1][1] - S[0][1]*S[1][0];
    const invS = [
        [ S[1][1]/det, -S[0][1]/det ],
        [ -S[1][0]/det, S[0][0]/det ]
    ];

    // K = P Hᵀ S⁻¹ (4x2)
    const K = Array(4).fill(null).map(()=>Array(2).fill(0));
    for (let i=0;i<4;i++){
        K[i][0] = KF.P[i][0]*invS[0][0] + KF.P[i][1]*invS[1][0];
        K[i][1] = KF.P[i][0]*invS[0][1] + KF.P[i][1]*invS[1][1];
    }

    // Atualização do estado: x = x + K*y
    KF.x = [
        KF.x[0] + K[0][0]*y[0] + K[0][1]*y[1],
        KF.x[1] + K[1][0]*y[0] + K[1][1]*y[1],
        KF.x[2] + K[2][0]*y[0] + K[2][1]*y[1],
        KF.x[3] + K[3][0]*y[0] + K[3][1]*y[1]
    ];

    // Atualização da covariância
    const KH = [
        [K[0][0], K[0][1], 0, 0],
        [K[1][0], K[1][1], 0, 0],
        [K[2][0], K[2][1], 0, 0],
        [K[3][0], K[3][1], 0, 0]
    ];

    KF.P = matMul44(subtract44(identity4(), KH), KF.P);

    // Corrige velocidade com heading real
    if (gpsSpeed && gpsHeading != null) {
        const rad = gpsHeading * Math.PI / 180;
        KF.x[2] = gpsSpeed * Math.cos(rad);
        KF.x[3] = gpsSpeed * Math.sin(rad);
    }

    return { lat: KF.x[0], lng: KF.x[1] };
}

function identity4() {
    return [
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0],
        [0,0,0,1]
    ];
}

function subtract44(A,B){
    const R = Array(4).fill(null).map(()=>Array(4).fill(0));
    for(let i=0;i<4;i++){
        for(let j=0;j<4;j++){
            R[i][j] = A[i][j] - B[i][j];
        }
    }
    return R;
}

function transpose(A){
    const R = Array(A[0].length).fill(null).map(()=>Array(A.length).fill(0));
    for (let i=0;i<A.length;i++){
        for (let j=0;j<A[i].length;j++){
            R[j][i] = A[i][j];
        }
    }
    return R;
}

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

export function stopGPS() {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    stopSensors();
}

/* ==========================================================
   PROCESSAR POSIÇÃO GPS
========================================================== */
function handlePosition(pos) {
    const { latitude, longitude, accuracy, speed, heading } = pos.coords;

    if (accuracy > 25) return;

    const timestamp = pos.timestamp;

    // ANTI-DRIFT
    const raw = { lat:latitude, lng:longitude };
    const filtered = driftFilter(raw);
    if (!filtered) return;

    // MÉDIA MÓVEL
    lastPositions.push(filtered);
    if (lastPositions.length > 10) lastPositions.shift();

    const avg = movingAverage(lastPositions);

    // KALMAN 4D REAL
    const final = kalman4D(avg, speed, heading ?? compassHeading, timestamp);

    updateMarker(final);

    fireCallbacks(
        final,
        accuracy,
        speed ?? 0,
        heading ?? compassHeading ?? lastHeading
    );
}

/* ==========================================================
   CALLBACKS DO APP
========================================================== */
function fireCallbacks(pos, accuracy, speed, heading) {
    gpsCallbacks.forEach(fn =>
        fn({
            lat: pos.lat,
            lng: pos.lng,
            accuracy,
            speed,
            heading,
            compass: compassHeading
        })
    );
}

/* ==========================================================
   ANTI-DRIFT
========================================================== */
function driftFilter(pos) {
    if (lastPositions.length === 0) return pos;

    const last = lastPositions[lastPositions.length-1];
    const d = distance(last.lat, last.lng, pos.lat, pos.lng);

    if (d > 50) return null;
    return pos;
}

/* ==========================================================
   MÉDIA MÓVEL
========================================================== */
function movingAverage(list) {
    let lat = 0, lng = 0;
    for (const p of list) {
        lat += p.lat;
        lng += p.lng;
    }
    return { lat: lat/list.length, lng: lng/list.length };
}

/* ==========================================================
   SENSORES — COMPASS
========================================================== */
function startSensors() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", e => {
            if (e.alpha != null) compassHeading = 360 - e.alpha;
        });
    }
}

function stopSensors() {
    window.removeEventListener("deviceorientation", () => {});
}

/* ==========================================================
   ATUALIZAR MARCADOR NO MAPA
========================================================== */
function updateMarker(pos) {
    const map = getMap();
    if (!map) return;

    updateUserPosition(pos.lat, pos.lng, compassHeading);
}

/* ==========================================================
   DISTÂNCIA
========================================================== */
function distance(lat1,lon1,lat2,lon2){
    const R = 6371e3;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;

    const a =
        Math.sin(dLat/2)**2 +
        Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) *
        Math.sin(dLon/2)**2;

    return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

/* ==========================================================
   ERRO
========================================================== */
function handleError(err) {
    showToast("Erro de GPS: " + err.message, "error");
}