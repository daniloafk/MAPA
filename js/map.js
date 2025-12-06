/* ==========================================================
   map.js — Controle principal do Google Maps (VERSÃO FINAL)
========================================================== */

import { appState, updateStatusBar } from "./app.js";

/* ==========================================================
   VARIÁVEIS
========================================================== */
let map;
let is3D = false;
let userMarker;

const DEFAULT_TILT = 45;
const DEFAULT_ZOOM = 18;
const DEFAULT_ZOOM_2D = 17;

/* ==========================================================
   INICIALIZA O MAPA
========================================================== */
export function initMap() {
    return new Promise(resolve => {
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: -23.55052, lng: -46.633308 }, // SP
            zoom: DEFAULT_ZOOM_2D,
            disableDefaultUI: true,
            gestureHandling: "greedy",
            tilt: 0,
            heading: 0,
            mapId: "4504f8b37365c3d0"
        });

        google.maps.event.addListenerOnce(map, "tilesloaded", () => {
            resolve(map);
        });
    });
}

export function setMapLoaded() {
    document.getElementById("map").classList.add("loaded");
}

/* ==========================================================
   MODO 3D / 2D
========================================================== */
export function toggle3D() {
    is3D = !is3D;

    map.moveCamera({
        tilt: is3D ? DEFAULT_TILT : 0,
        zoom: is3D ? DEFAULT_ZOOM : DEFAULT_ZOOM_2D,
        heading: is3D ? map.getHeading() : 0
    });

    document.getElementById("btn3D").textContent = is3D ? "2D" : "3D";
}

/* ==========================================================
   ATUALIZA POSIÇÃO DO USUÁRIO
========================================================== */
export function updateUserPosition(lat, lng, heading = null) {
    if (!map) return;

    const pos = new google.maps.LatLng(lat, lng);

    if (!userMarker) {
        userMarker = new google.maps.Marker({
            position: pos,
            map,
            title: "Você",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285f4",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 2
            }
        });
    }

    animateMarker(userMarker, pos);

    // Integração real de heading do GPS
    if (heading !== null && is3D) {
        map.moveCamera({
            heading: heading
        });
    }
}

/* ==========================================================
   CENTRALIZAR NO USUÁRIO
========================================================== */
export function centerUserOnMap() {
    if (!userMarker) {
        updateStatusBar("Aguardando localização...", false);
        return;
    }

    map.panTo(userMarker.getPosition());
    updateStatusBar("Centralizado", true);
}

/* ==========================================================
   ANIMAÇÃO DO MARCADOR (TWEEN)
========================================================== */
function animateMarker(marker, targetPos) {
    const start = marker.getPosition();
    const end = targetPos;

    const coords = {
        lat: start.lat(),
        lng: start.lng()
    };

    new TWEEN.Tween(coords)
        .to(
            { lat: end.lat(), lng: end.lng() },
            500
        )
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            marker.setPosition(new google.maps.LatLng(coords.lat, coords.lng));
        })
        .start();
}

/* ==========================================================
   LOOP GLOBAL DO TWEEN
========================================================== */
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
}
animate();

/* ==========================================================
   EXPORTAR MAPA
========================================================== */
export function getMap() {
    return map;
}