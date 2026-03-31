import { type NextRequest, NextResponse } from "next/server";
import settingsDb from "@/lib/settings-db";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "key parameter required" }, { status: 400 });
    }
    const row = settingsDb
      .prepare("SELECT key, value FROM settings WHERE key = ?")
      .get(key) as { key: string; value: string } | undefined;
    return NextResponse.json({ key, value: row?.value ?? null });
  } catch (err) {
    console.error("[settings GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { key?: string; value?: string };
    const { key, value } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }
    settingsDb
      .prepare(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, unixepoch())"
      )
      .run(key, value);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[settings POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
