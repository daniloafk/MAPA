// API Serverless para Fleet Routing (Vercel)
// Este arquivo roda no backend e tem acesso ao Service Account

const { JWT } = require('google-auth-library');

// Configuração do Service Account
// IMPORTANTE: As credenciais serão passadas via variáveis de ambiente
const getServiceAccountCredentials = () => {
  try {
    // Vercel suporta variáveis de ambiente
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    return credentials;
  } catch (error) {
    console.error('Erro ao parsear credenciais:', error);
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada corretamente');
  }
};

// Criar cliente autenticado
const getAuthenticatedClient = async () => {
  const credentials = getServiceAccountCredentials();

  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  await client.authorize();
  return client;
};

// Handler principal da API
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST é aceito
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { origin, deliveryPoints, projectId } = req.body;

    // Validação
    if (!origin || !deliveryPoints || !projectId) {
      return res.status(400).json({
        error: 'Missing required fields: origin, deliveryPoints, projectId'
      });
    }

    console.log(`Processando rota para ${deliveryPoints.length} pontos`);

    // Preparar payload para Fleet Routing API
    const payload = {
      parent: `projects/${projectId}`,
      model: {
        shipments: deliveryPoints.map((point, index) => ({
          deliveries: [{
            arrivalWaypoint: {
              location: {
                latLng: {
                  latitude: point.location.lat,
                  longitude: point.location.lng
                }
              }
            }
          }],
          label: `Entrega ${index + 1}`
        })),
        vehicles: [{
          startWaypoint: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lng
              }
            }
          },
          endWaypoint: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lng
              }
            }
          },
          label: "Veículo 1"
        }]
      }
    };

    // Obter cliente autenticado
    const authClient = await getAuthenticatedClient();

    // Chamar Fleet Routing API
    const url = `https://routeoptimization.googleapis.com/v1/projects/${projectId}:optimizeTours`;

    const response = await authClient.request({
      url: url,
      method: 'POST',
      data: payload
    });

    console.log('Fleet API respondeu com sucesso');

    // Retornar resultado
    return res.status(200).json({
      success: true,
      result: response.data
    });

  } catch (error) {
    console.error('Erro ao processar rota:', error);

    // Retornar erro detalhado
    return res.status(500).json({
      error: 'Erro ao calcular rota',
      message: error.message,
      details: error.response?.data || null
    });
  }
};
