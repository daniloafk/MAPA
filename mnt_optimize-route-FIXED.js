// Cloudflare Pages Function para Fleet Routing API
// Rota: /api/optimize-route

// Função para criar JWT para autenticação Google Cloud
async function createJWT(serviceAccount) {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Importar chave privada
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        pemToArrayBuffer(serviceAccount.private_key),
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
        },
        false,
        ['sign']
    );

    // Assinar
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(unsignedToken)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${unsignedToken}.${encodedSignature}`;
}

// Converter PEM para ArrayBuffer
function pemToArrayBuffer(pem) {
    const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Obter Access Token do Google
async function getAccessToken(serviceAccount) {
    const jwt = await createJWT(serviceAccount);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Falha ao obter access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function onRequestPost(context) {
    try {
        const body = await context.request.json();
        const { origin, deliveryPoints, projectId } = body;

        if (!origin || !deliveryPoints || !projectId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Parâmetros inválidos. Requeridos: origin, deliveryPoints, projectId'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Buscar Service Account das variáveis de ambiente
        const serviceAccountJson = context.env.GOOGLE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountJson) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Credenciais do Google Cloud não configuradas'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        console.log('🚗 Fleet Routing - Otimizando rota:', {
            origin,
            deliveryCount: deliveryPoints.length,
            projectId
        });

        // Obter access token
        const accessToken = await getAccessToken(serviceAccount);

        // Preparar requisição para Fleet Routing API
        const fleetUrl = `https://cloudoptimization.googleapis.com/v1/projects/${projectId}:optimizeTours`;

        // Montar modelo de otimização (snake_case conforme API do Google)
        const currentDate = new Date().toISOString().split('T')[0];

        const model = {
            shipments: deliveryPoints.map((delivery, index) => ({
                deliveries: [{
                    arrival_location: {
                        latitude: parseFloat(delivery.lat),
                        longitude: parseFloat(delivery.lng)
                    },
                    duration: "300s",
                    time_windows: [{
                        start_time: `${currentDate}T08:00:00Z`,
                        end_time: `${currentDate}T18:00:00Z`
                    }]
                }],
                label: `delivery_${index}`
            })),
            vehicles: [{
                label: "vehicle_1",
                start_location: {
                    latitude: parseFloat(origin.lat),
                    longitude: parseFloat(origin.lng)
                },
                end_location: {
                    latitude: parseFloat(origin.lat),
                    longitude: parseFloat(origin.lng)
                },
                cost_per_kilometer: 1.0,
                cost_per_hour: 1.0
            }]
        };

        // Chamar Fleet Routing API
        const fleetResponse = await fetch(fleetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ model })
        });

        if (!fleetResponse.ok) {
            const errorText = await fleetResponse.text();
            console.error('❌ Fleet Routing API error:', errorText);

            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = JSON.stringify(errorJson, null, 2);
            } catch (e) {
                // Se não for JSON, mantém como texto
            }

            return new Response(JSON.stringify({
                success: false,
                message: `Fleet Routing API retornou erro: ${fleetResponse.status}`,
                details: errorDetails,
                requestModel: model // Incluir modelo enviado para debug
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
