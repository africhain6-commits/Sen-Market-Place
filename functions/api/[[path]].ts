// Relais /api/* vers l'API SenMarket (Render), comme la règle de redirection de Netlify.
// Garde les cookies de connexion sur senmarket.net.
const API_ORIGIN = "https://senmarket-api.onrender.com";

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", "https");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  return fetch(API_ORIGIN + url.pathname + url.search, init);
}
