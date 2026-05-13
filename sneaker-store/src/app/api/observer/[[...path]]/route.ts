export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OBSERVER_SERVER_URL =
  process.env.OBSERVER_SERVER_URL?.trim() || "http://observer:8001";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
};

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

function observerTarget(request: Request, path: string[] = []) {
  const incoming = new URL(request.url);
  const base = new URL(OBSERVER_SERVER_URL);
  const basePath = base.pathname.replace(/\/$/, "");
  const proxyPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  base.pathname = proxyPath ? `${basePath}/${proxyPath}` : basePath || "/";
  base.search = incoming.search;
  return base;
}

function forwardedHeaders(request: Request) {
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  return headers;
}

async function proxyObserver(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const target = observerTarget(request, path);
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstream = await fetch(target, {
      method,
      headers: forwardedHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    const headers = new Headers(upstream.headers);
    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Observer proxy failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function GET(request: Request, context: RouteContext) {
  return proxyObserver(request, context);
}

export function POST(request: Request, context: RouteContext) {
  return proxyObserver(request, context);
}

export function DELETE(request: Request, context: RouteContext) {
  return proxyObserver(request, context);
}
