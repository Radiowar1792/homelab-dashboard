import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const ServiceUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  category: z.string().nullable().optional(),
  expectedStatus: z.number().int().optional(),
  timeout: z.number().int().min(100).max(30000).optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/services/[id] — Met à jour un service
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const data = ServiceUpdateSchema.parse(body);
    // Filtrer les undefined pour compatibilité exactOptionalPropertyTypes
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    const service = await prisma.serviceDefinition.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/services/[id] — Supprime un service
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.serviceDefinition.delete({ where: { id } });
    return NextResponse.json({ deleted: id });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
