import { loadClientsFromSupabase } from "/js/clients.js";
import { initMap } from "/js/map.js";
import { showToast } from "/js/utils.js";

export const appState = {
    mapLoaded: false
};

export async function initApp() {
    try {
        await google.maps.importLibrary("maps");
        await google.maps.importLibrary("marker");
        await google.maps.importLibrary("places");
        await google.maps.importLibrary("geometry");

        initMap();
        await loadClientsFromSupabase();

        document.getElementById("loading-screen").classList.add("hidden");
        appState.mapLoaded = true;
    } catch (err) {
        console.error(err);
        showToast("Erro ao iniciar mapa", "error");
    }
}