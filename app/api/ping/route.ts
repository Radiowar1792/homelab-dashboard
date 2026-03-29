import { type NextRequest, NextResponse } from "next/server";
import * as net from "net";

// GET /api/ping?url=https://... — HTTP-based reachability check (avoids CORS from client)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url requis" }, { status: 400 });
  }
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    const latency = Date.now() - start;
    return NextResponse.json({ online: res.status < 500, latency });
  } catch {
    return NextResponse.json({ online: false, latency: null });
  }
}

export async function POST(req: NextRequest) {
  let host: string;
  let port: number;

  try {
    const body = (await req.json()) as { host?: string; port?: number };
    host = body.host ?? "";
    port = body.port ?? 80;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!host) {
    return NextResponse.json({ error: "host requis" }, { status: 400 });
  }

  const latency = await new Promise<number | null>((resolve) => {
    const start = Date.now();
    const socket = net.createConnection({ host, port });

    socket.setTimeout(5000);

    socket.on("connect", () => {
      const ms = Date.now() - start;
      socket.destroy();
      resolve(ms);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });

    socket.on("error", () => {
      resolve(null);
    });
  });

  return NextResponse.json({
    online: latency !== null,
    latency,
  });
}
