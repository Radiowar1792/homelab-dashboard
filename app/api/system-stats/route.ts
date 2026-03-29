import { NextResponse } from "next/server";
import os from "os";

export async function GET() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const load = os.loadavg();
  const cpus = os.cpus();

  return NextResponse.json({
    cpu: {
      cores: cpus.length,
      load1: load[0],
      load5: load[1],
      load15: load[2],
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usedPct: Math.round((usedMem / totalMem) * 100),
    },
    uptime: os.uptime(),
    platform: os.platform(),
    hostname: os.hostname(),
  });
}
