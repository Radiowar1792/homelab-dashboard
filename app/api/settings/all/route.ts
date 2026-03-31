import { NextResponse } from "next/server";
import settingsDb from "@/lib/settings-db";

export async function GET() {
  try {
    const rows = settingsDb
      .prepare("SELECT key, value FROM settings")
      .all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("[settings/all GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
