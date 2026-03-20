import { NextResponse } from "next/server";
import { z } from "zod";

// Schéma de validation du message de chat
const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

const ChatRequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(ChatMessageSchema).min(1),
  stream: z.boolean().optional().default(false),
});

const OLLAMA_URL = process.env["OLLAMA_URL"] ?? "http://localhost:11434";

/**
 * GET /api/llm — Liste les modèles Ollama disponibles
 */
export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Ollama répond avec ${response.status}`);
    }

    const data: unknown = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Ollama inaccessible", details: String(error) },
      { status: 503 }
    );
  }
}

/**
 * POST /api/llm — Proxy vers Ollama chat completions
 * Supporte le streaming pour une expérience chat fluide
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const chatRequest = ChatRequestSchema.parse(body);

    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatRequest),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama répond avec ${ollamaResponse.status}`);
    }

    // Si streaming demandé, on pipe la réponse directement
    if (chatRequest.stream && ollamaResponse.body) {
      return new Response(ollamaResponse.body, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    const data: unknown = await ollamaResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Requête invalide", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erreur LLM", details: String(error) },
      { status: 502 }
    );
  }
}
