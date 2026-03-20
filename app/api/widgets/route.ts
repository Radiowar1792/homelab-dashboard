import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const sizeEnum = z.enum(["small", "medium", "large", "full"]);

const WidgetCreateSchema = z.object({
  type: z.string().min(1),
  position: z.number().int().min(0),
  size: sizeEnum,
  config: z.record(z.unknown()),
  isVisible: z.boolean().optional().default(true),
});

const WidgetReorderSchema = z.array(
  z.object({
    id: z.string(),
    position: z.number().int().min(0),
  })
);

function toDbSize(size: string) {
  return size.toUpperCase() as "SMALL" | "MEDIUM" | "LARGE" | "FULL";
}

function fromDbSize(size: string) {
  return size.toLowerCase() as "small" | "medium" | "large" | "full";
}

/**
 * GET /api/widgets — Récupère la configuration de tous les widgets
 */
export async function GET() {
  try {
    const widgets = await prisma.widgetConfig.findMany({
      orderBy: { position: "asc" },
    });
    return NextResponse.json({
      widgets: widgets.map((w) => ({ ...w, size: fromDbSize(w.size) })),
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/widgets — Crée un nouveau widget
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = WidgetCreateSchema.parse(body);

    const widget = await prisma.widgetConfig.create({
      data: {
        type: data.type,
        position: data.position,
        size: toDbSize(data.size),
        config: data.config as Prisma.InputJsonValue,
        isVisible: data.isVisible,
      },
    });

    return NextResponse.json(
      { widget: { ...widget, size: fromDbSize(widget.size) } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/widgets — Réordonne les widgets après drag & drop
 */
export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const updates = WidgetReorderSchema.parse(body);

    await prisma.$transaction(
      updates.map(({ id, position }) =>
        prisma.widgetConfig.update({ where: { id }, data: { position } })
      )
    );

    return NextResponse.json({ updated: updates.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
