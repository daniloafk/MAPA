/* ==========================================================
   markers.js — Controle dos marcadores no mapa
========================================================== */

import { getMap } from "./map.js";

/* ==========================================================
   LISTAS DE MARCADORES
========================================================== */

let clientMarkers = [];
let matchedMarkers = [];

let clientsVisible = true;
let matchedVisible = false;

/* ==========================================================
   ADICIONAR MARCADOR DE CLIENTE NORMAL
========================================================== */
export function addClientMarker(client) {
    const map = getMap();

    const marker = new google.maps.Marker({
        map,
        position: { lat: client.lat, lng: client.lng },
        title: client.name,
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(40, 40)
        }
    });

    clientMarkers.push(marker);
}

/* ==========================================================
   LIMPAR TODOS OS MARCADORES DE CLIENTES
========================================================== */
export function clearClientMarkers() {
    clientMarkers.forEach(m => m.setMap(null));
    clientMarkers = [];
}

/* ==========================================================
   ALTERNAR VISIBILIDADE DOS CLIENTES
========================================================== */
export function toggleClientMarkers() {
    clientsVisible = !clientsVisible;

    clientMarkers.forEach(m => m.setMap(clientsVisible ? getMap() : null));

    const btn = document.getElementById("btnToggleClients");
    btn.classList.toggle("active", clientsVisible);
}

/* ==========================================================
   ADICIONAR MARCADOR DE CLIENTE ENCONTRADO NA PLANILHA
========================================================== */
export function addMatchedMarker(client) {
    const map = getMap();

    const marker = new google.maps.Marker({
        map,
        position: { lat: client.lat, lng: client.lng },
        title: `Encontrado na planilha: ${client.name}`,
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(42, 42)
        }
    });

    matchedMarkers.push(marker);

    // Só aparece se o toggle estiver ativo
    if (!matchedVisible) {
        marker.setMap(null);
    }
}

/* ==========================================================
   LIMPAR MARCADORES DE CLIENTES ENCONTRADOS
========================================================== */
export function clearMatchedMarkers() {
    matchedMarkers.forEach(m => m.setMap(null));
    matchedMarkers = [];
}

/* ==========================================================
   ALTERNAR VISIBILIDADE CLIENTES ENCONTRADOS
========================================================== */
export function toggleMatchedMarkers() {
    matchedVisible = !matchedVisible;

    matchedMarkers.forEach(m =>
        m.setMap(matchedVisible ? getMap() : null)
    );

    const btn = document.getElementById("btnMatchedClients");
    btn.classList.toggle("active", matchedVisible);
}