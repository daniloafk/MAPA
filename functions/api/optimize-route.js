// Cloudflare Pages Function para Fleet Routing API
// Rota: /api/optimize-route

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();

        const { origin, deliveryPoints, apiKey, projectId } = body;

        if (!origin || !deliveryPoints || !apiKey || !projectId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Parâmetros inválidos. Requeridos: origin, deliveryPoints, apiKey, projectId'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('🚗 Fleet Routing - Otimizando rota:', {
            origin,
            deliveryCount: deliveryPoints.length,
            projectId
        });

        // Preparar requisição para Fleet Routing API
        const fleetUrl = `https://cloudoptimization.googleapis.com/v1/projects/${projectId}:optimizeTours`;

        // Montar modelo de otimização
        const model = {
            shipments: deliveryPoints.map((delivery, index) => ({
                deliveries: [{
                    arrivalLocation: {
                        latLng: {
                            latitude: delivery.lat,
                            longitude: delivery.lng
                        }
                    },
                    duration: "300s", // 5 minutos por entrega
                    timeWindows: [{
                        startTime: "2024-01-01T08:00:00Z",
                        endTime: "2024-01-01T18:00:00Z"
                    }]
                }],
                label: `Entrega ${index + 1}`
            })),
            vehicles: [{
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
                costPerKilometer: 1,
                travelDurationMultipleCost: 1
            }],
            globalStartTime: "2024-01-01T08:00:00Z",
            globalEndTime: "2024-01-01T18:00:00Z"
        };

        // Chamar Fleet Routing API
        const fleetResponse = await fetch(fleetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'routes.visits,routes.transitions,routes.metrics'
            },
            body: JSON.stringify({ model })
        });

        if (!fleetResponse.ok) {
            const errorText = await fleetResponse.text();
            console.error('❌ Fleet Routing API error:', errorText);

            return new Response(JSON.stringify({
                success: false,
                message: `Fleet Routing API retornou erro: ${fleetResponse.status}`,
                details: errorText
            }), {
                status: fleetResponse.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const fleetResult = await fleetResponse.json();

        console.log('✅ Fleet Routing - Rota otimizada:', {
            routes: fleetResult.routes?.length || 0,
            visits: fleetResult.routes?.[0]?.visits?.length || 0
        });

        return new Response(JSON.stringify({
            success: true,
            result: fleetResult
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ Erro no backend:', error);

        return new Response(JSON.stringify({
            success: false,
            message: error.message || 'Erro desconhecido no backend'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Suporte a CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
