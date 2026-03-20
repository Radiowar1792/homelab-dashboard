import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const sizeEnum = z.enum(["small", "medium", "large", "full"]);

const WidgetUpdateSchema = z.object({
  size: sizeEnum.optional(),
  config: z.record(z.unknown()).optional(),
  isVisible: z.boolean().optional(),
});

function toDbSize(size: string) {
  return size.toUpperCase() as "SMALL" | "MEDIUM" | "LARGE" | "FULL";
}

/**
 * PATCH /api/widgets/[id] — Met à jour la config ou la taille d'un widget
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const data = WidgetUpdateSchema.parse(body);

    const widget = await prisma.widgetConfig.update({
      where: { id },
      data: {
        ...(data.size !== undefined && { size: toDbSize(data.size) }),
        ...(data.config !== undefined && { config: data.config as Prisma.InputJsonValue }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
      },
    });

    return NextResponse.json({
      widget: { ...widget, size: widget.size.toLowerCase() },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/widgets/[id] — Supprime un widget
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.widgetConfig.delete({ where: { id } });
    return NextResponse.json({ deleted: id });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
