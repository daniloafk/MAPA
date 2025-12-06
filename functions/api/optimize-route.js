// Cloudflare Pages Function - Fleet Routing API

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function stringToBase64Url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem) {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const binary = atob(pemContents);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function createSignedJWT(serviceAccount, projectId) {
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: serviceAccount.private_key_id,
  };

  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloud-platform",
    quota_project_id: projectId,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  return `${unsignedToken}.${arrayBufferToBase64Url(signature)}`;
}

async function getAccessToken(serviceAccount, projectId) {
  const jwt = await createSignedJWT(serviceAccount, projectId);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt,
  });

  if (!res.ok) throw new Error(await res.text());

  return (await res.json()).access_token;
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { origin, deliveryPoints, projectId } = body;

    if (!origin || !deliveryPoints || !projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parâmetros inválidos (origin, deliveryPoints, projectId)",
        }),
        { status: 400 }
      );
    }

    const serviceAccount = JSON.parse(context.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const accessToken = await getAccessToken(serviceAccount, projectId);

    const url = `https://routeoptimization.googleapis.com/v1/projects/${projectId}:optimizeTours`;

    const payload = {
      parent: `projects/${projectId}`,
      model: {
        shipments: deliveryPoints.map((p, i) => ({
          deliveries: [
            {
              arrivalWaypoint: {
                location: {
                  latLng: {
                    latitude: parseFloat(p.lat),
                    longitude: parseFloat(p.lng),
                  },
                },
              },
            },
          ],
          label: `Entrega ${i + 1}`,
        })),

        vehicles: [
          {
            label: "Veículo 1",
            startWaypoint: {
              location: {
                latLng: {
                  latitude: parseFloat(origin.lat),
                  longitude: parseFloat(origin.lng),
                },
              },
            },
            endWaypoint: {
              location: {
                latLng: {
                  latitude: parseFloat(origin.lat),
                  longitude: parseFloat(origin.lng),
                },
              },
            },
            costPerMinute: 0.5,
            costPerKm: 0.3,
          },
        ],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Goog-User-Project": projectId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          status: res.status,
          details: await res.text(),
        }),
        { status: res.status }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: await res.json() }),
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}