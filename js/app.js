//---------------------------------------------------------
// Google Maps – Inicialização Completa
//---------------------------------------------------------

let map;
let userMarker;
let watchId = null;

// 🔧 COLOQUE SUA API KEY AQUI:
const GOOGLE_MAPS_API_KEY = "AIzaSyApaDb9rSw2sNTaY7fjBqmrgjWYD9xwjcU";

//---------------------------------------------------------
// Carregar script do Google Maps dinamicamente
//---------------------------------------------------------
function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google && google.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=` +
      GOOGLE_MAPS_API_KEY +
      "&libraries=geometry,places";
    script.async = true;
    script.defer = true;

    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}

//---------------------------------------------------------
// Inicializar Mapa
//---------------------------------------------------------
async function initMap() {
  document.getElementById("app").innerText = "Carregando Google Maps...";

  try {
    await loadGoogleMaps();
  } catch (err) {
    console.error("Erro ao carregar Google Maps:", err);
    document.getElementById("app").innerHTML =
      "❌ Erro ao carregar Google Maps.";
    return;
  }

  document.getElementById("app").innerHTML =
    `<div id="map"></div>
    <button id="btnStartGps" style="margin-top:20px; padding:10px 15px;">📍 Rastrear Localização</button>`;

  const startPosition = { lat: -15.77972, lng: -47.92972 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: startPosition,
    zoom: 14,
    gestureHandling: "greedy",
  });

  userMarker = new google.maps.Marker({
    map,
    position: startPosition,
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      scaledSize: new google.maps.Size(50, 50),
    },
  });

  document.getElementById("btnStartGps").addEventListener("click", startGPS);
}

//---------------------------------------------------------
// Ativar rastreamento contínuo de GPS
//---------------------------------------------------------
function startGPS() {
  if (!navigator.geolocation) {
    alert("Seu navegador não suporta geolocalização.");
    return;
  }

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    alert("Rastreamento desativado.");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const newPos = { lat, lng };

      userMarker.setPosition(newPos);
      map.panTo(newPos);
    },
    (err) => {
      console.error("Erro ao obter localização:", err);
      alert("Erro ao obter localização.");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000,
    }
  );

  alert("GPS ativado! Acompanhe seu movimento no mapa.");
}

initMap();