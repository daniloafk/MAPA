/* ==========================================================
   map.js — Controle principal do Google Maps
========================================================== */

import { appState, updateStatusBar } from "./app.js";

/* ==========================================================
   VARIÁVEIS GLOBAIS DO MAPA
========================================================== */
let map;
let is3D = false;
let userMarker;

/* Tone down animation for smoother experience */
const DEFAULT_TILT = 45;
const DEFAULT_ZOOM = 18;
const DEFAULT_ZOOM_2D = 17;

/* ==========================================================
   INICIALIZA O MAPA
========================================================== */
export function initMap() {
    return new Promise(resolve => {
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: -23.55052, lng: -46.633308 }, // São Paulo centro
            zoom: 16,
            disableDefaultUI: true,
            gestureHandling: "greedy",
            tilt: 0,
            heading: 0,
            mapId: "4504f8b37365c3d0" // ID padrão do Google
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
   CONTROLE 3D / 2D
========================================================== */
export function toggle3D() {
    is3D = !is3D;

    map.moveCamera({
        tilt: is3D ? DEFAULT_TILT : 0,
        zoom: is3D ? DEFAULT_ZOOM : DEFAULT_ZOOM_2D,
        heading: is3D ? 20 : 0
    });

    document.getElementById("btn3D").textContent = is3D ? "2D" : "3D";
}

/* ==========================================================
   ATUALIZAÇÃO DA POSIÇÃO DO USUÁRIO
========================================================== */
export function updateUserPosition(lat, lng) {
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
   FUNÇÃO DE ANIMAÇÃO DO MARCADOR (Tween.js)
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
            650
        )
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            marker.setPosition(new google.maps.LatLng(coords.lat, coords.lng));
        })
        .start();
}

/* ==========================================================
   LOOP DE ANIMAÇÃO GLOBAL (Tween.js)
========================================================== */
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
}
animate();

/* ==========================================================
   EXPORTA O MAP ATUAL
========================================================== */
export function getMap() {
    return map;
}