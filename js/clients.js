/* ==========================================================
   clients.js — CRUD + UI + Supabase (VERSÃO FINAL INTEGRADA)
========================================================== */

import { showToast } from "./utils.js";
import { addClientMarker, clearClientMarkers, focusClientMarker } from "./markers.js";
import { closeModal, openModal } from "./app.js";

/* ==========================================================
   SUPABASE
========================================================== */

const SUPABASE_URL = "https://pstiwhopekblruynrfbv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdGl3aG9wZWtibHJ1eW5yZmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzMyNzgsImV4cCI6MjA1MTIwOTI3OH0.enSadNFS48baryc-Z2HqU-Kl-QzslZf2ZzS0PTsuU10";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ==========================================================
   CLIENTES NA MEMÓRIA
========================================================== */

export let clients = [];

/* ==========================================================
   CARREGA CLIENTES DO SUPABASE
========================================================== */
export async function loadClientsFromSupabase() {
    const { data, error } = await supabase.from("clientes").select("*");

    if (error) {
        console.error(error);
        showToast("Erro ao carregar clientes", "error");
        return;
    }

    clients = data || [];

    localStorage.setItem("clients", JSON.stringify(clients));

    clearClientMarkers();
    clients.forEach(addClientMarker);
}

/* ==========================================================
   RENDERIZAR LISTA DE CLIENTES
========================================================== */
export function renderClientList() {
    const list = document.getElementById("clients-list");
    list.innerHTML = "";

    if (clients.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                Nenhum cliente cadastrado
            </div>`;
        document.getElementById("client-count").textContent = "0";
        return;
    }

    clients.forEach(client => {
        const card = document.createElement("div");
        card.className = "client-card";

        card.innerHTML = `
            <div><b>${client.name}</b></div>
            <div>${client.phone || ""}</div>
            <div style="font-size:12px; opacity:0.7;">
                ${client.address || "Endereço não informado"}
            </div>
        `;

        /* =====================================================
           EVENTO: Clicar no cliente → centralizar no mapa
        ====================================================== */
        card.onclick = () => {
            focusClientMarker(client.id);
            showToast(`Centralizando em ${client.name}...`, "success", 1500);
        };

        list.appendChild(card);
    });

    document.getElementById("client-count").textContent = clients.length;
}

/* ==========================================================
   SALVAR CLIENTE
========================================================== */
export async function handleClientSave(e) {
    e.preventDefault();

    const name = document.getElementById("client-name").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const address = document.getElementById("address-text").textContent.trim();

    if (!name) {
        showToast("O nome é obrigatório.", "warning");
        return;
    }

    if (!address) {
        showToast("Nenhum QR de endereço lido!", "warning");
        return;
    }

    const coords = await geocodeAddress(address);

    if (!coords) {
        showToast("Endereço inválido no QR Code", "error");
        return;
    }

    const newClient = {
        name,
        phone,
        address,
        lat: coords.lat,
        lng: coords.lng
    };

    const { data, error } = await supabase
        .from("clientes")
        .insert(newClient)
        .select();

    if (error) {
        console.error(error);
        showToast("Erro ao salvar cliente.", "error");
        return;
    }

    const saved = data[0];
    clients.push(saved);

    localStorage.setItem("clients", JSON.stringify(clients));
    renderClientList();
    addClientMarker(saved);

    closeModal("modal-client");

    showToast("Cliente salvo com sucesso!", "success", 2500);
}

/* ==========================================================
   GEOCODING DO QR CODE
========================================================== */
async function geocodeAddress(text) {
    try {
        const url =
            `https://maps.googleapis.com/maps/api/geocode/json?address=` +
            encodeURIComponent(text) +
            `&key=AIzaSyApaDb9rSw2sNTaY7fjBqmrgjWYD9xwjcU`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.results?.length) return null;

        return data.results[0].geometry.location;

    } catch (err) {
        console.error(err);
        return null;
    }
}

/* ==========================================================
   BUSCA LOCAL
========================================================== */
export function searchClients(term) {
    term = term.toLowerCase();

    return clients.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        (c.address && c.address.toLowerCase().includes(term))
    );
}