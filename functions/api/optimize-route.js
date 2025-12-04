// Cloudflare Pages Function para Fleet Routing API
// Rota: /api/optimize-route

// Função auxiliar para converter ArrayBuffer para base64url
function arrayBufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Função auxiliar para converter string para base64url
function stringToBase64Url(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Converter PEM para CryptoKey
async function importPrivateKey(pem) {
    // Remove headers e footers do PEM
    const pemContents = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');

    // Decode base64 para ArrayBuffer
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Importar como CryptoKey
    return await crypto.subtle.importKey(
        'pkcs8',
        bytes.buffer,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
        },
        false,
        ['sign']
    );
}

// Criar JWT assinado
async function createSignedJWT(serviceAccount) {
    const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: serviceAccount.private_key_id
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        iat: now,
        exp: now + 3600
    };

    // Encode header e payload
    const encodedHeader = stringToBase64Url(JSON.stringify(header));
    const encodedPayload = stringToBase64Url(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Importar private key
    const privateKey = await importPrivateKey(serviceAccount.private_key);

    // Assinar
    const encoder = new TextEncoder();
    const data = encoder.encode(unsignedToken);
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        data
    );

    // Encode signature
    const encodedSignature = arrayBufferToBase64Url(signature);

    return `${unsignedToken}.${encodedSignature}`;
}

// Obter Access Token do Google
async function getAccessToken(serviceAccount) {
    try {
        const jwt = await createSignedJWT(serviceAccount);

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro ao obter token:', errorText);
            throw new Error(`Falha ao obter access token: ${errorText}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('❌ Erro no getAccessToken:', error);
        throw error;
    }
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
            projectId,
            serviceAccountEmail: serviceAccount.client_email
        });

        // Obter access token
        console.log('🔑 Obtendo access token...');
        const accessToken = await getAccessToken(serviceAccount);
        console.log('✅ Access token obtido com sucesso');

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

        console.log('📤 Chamando Fleet Routing API...');

        // Chamar Fleet Routing API
        const fleetResponse = await fetch(fleetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Goog-User-Project': projectId
            },
            body: JSON.stringify({ model })
        });

        console.log(`📥 Resposta Fleet API: ${fleetResponse.status}`);

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
                requestModel: model
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
        console.error('Stack:', error.stack);

        return new Response(JSON.stringify({
            success: false,
            message: error.message || 'Erro desconhecido no backend',
            stack: error.stack
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
