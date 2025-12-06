// ==========================================================
//  optimize-route.js — Cloudflare Pages Function
//  Usa Google Fleet Routing API para montar rotas otimizadas
// ==========================================================

export const onRequestPost = async ({ request, env }) => {
    try {
        const body = await request.json();

        const origin = body.origin;
        const clients = body.clients || [];

        if (!origin || !clients.length) {
            return jsonResponse({ error: "Dados inválidos" }, 400);
        }

        // Sua chave real (conforme escolha A)
        const apiKey = "AIzaSyApaDb9rSw2sNTaY7fjBqmrgjWYD9xwjcU";

        const url = `https://fleetrouting.googleapis.com/v2:optimizeTours?key=${apiKey}`;

        // Construção do payload da Fleet Routing API
        const payload = {
            model: {
                shipments: clients.map((c, idx) => ({
                    pickupToDelivery: {
                        // Apenas uma "delivery" por cliente
                        delivery: {
                            arrivalLocation: {
                                latLng: {
                                    latitude: c.lat,
                                    longitude: c.lng
                                }
                            }
                        }
                    },
                    label: c.name || `Cliente ${idx}`
                })),

                vehicles: [
                    {
                        label: "VeiculoPrincipal",
                        startLocation: {
                            latLng: {
                                latitude: origin.lat,
                                longitude: origin.lng
                            }
                        },
                        endLocation: {
                            latLng: {
                                latitude: origin.lat,
                                longitude: origin.lng
                            }
                        },
                        travelMode: "DRIVE"
                    }
                ]
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Fleet Routing error:", err);
            return jsonResponse({ error: "Erro na Fleet Routing API" }, 500);
        }

        const result = await response.json();

        // Extrair pontos na rota retornada
        const points = extractRoutePoints(result);

        return jsonResponse({ route: points });
        
    } catch (err) {
        console.error("Erro interno:", err);
        return jsonResponse({ error: "Falha interna do servidor" }, 500);
    }
};


// ==========================================================
//  Converte o retorno complexo em uma lista simples de coordenadas
// ==========================================================
function extractRoutePoints(result) {
    try {
        const vehicle = result.routes?.[0];
        const path = [];

        vehicle?.routePolyline?.points?.forEach(p => {
            if (p && p.latitude && p.longitude) {
                path.push({ lat: p.latitude, lng: p.longitude });
            }
        });

        return path;
    } catch (err) {
        console.error("Erro ao extrair polyline:", err);
        return [];
    }
}


// ==========================================================
//  Helper de resposta JSON
// ==========================================================
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}