import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const runtime = "nodejs";

interface GenerateImageRequest {
  prompt: string;
  negative_prompt?: string;
  width: number;
  height: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
}

const invalid = (message: string, status = 400) =>
  Response.json({ error: message }, { status });

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.id) return invalid("Unauthorized", 401);

    if (!process.env.MODAL_ZIMAGE_URL) {
      return invalid("MODAL_ZIMAGE_URL is not set", 500);
    }

    const data = (await request.json()) as Partial<GenerateImageRequest>;
    const prompt = typeof data.prompt === "string" ? data.prompt.trim() : "";
    const width = data.width;
    const height = data.height;
    const steps = data.num_inference_steps;
    const guidance = data.guidance_scale;
    const seed = typeof data.seed === "number" ? data.seed : undefined;

    if (!prompt || prompt.length > 1500) {
      return invalid("Prompt must be between 1 and 1500 characters");
    }

    if (
      typeof width !== "number" ||
      typeof height !== "number" ||
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 256 ||
      width > 2048 ||
      height < 256 ||
      height > 2048
    ) {
      return invalid("Image dimensions must be integers between 256 and 2048");
    }

    if (
      steps !== undefined &&
      (!Number.isInteger(steps) || steps < 1 || steps > 15)
    ) {
      return invalid("Inference steps must be between 1 and 15");
    }

    if (
      guidance !== undefined &&
      (!Number.isFinite(guidance) || guidance < 0 || guidance > 8)
    ) {
      return invalid("Guidance scale must be between 0 and 8");
    }

    if (seed !== undefined && (!Number.isInteger(seed) || seed < 0)) {
      return invalid("Seed must be a positive integer");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user) return invalid("User not found", 404);
    if (user.credits < 1) return invalid("Insufficient credits", 402);

    const modalResponse = await fetch(process.env.MODAL_ZIMAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        negative_prompt:
          typeof data.negative_prompt === "string"
            ? data.negative_prompt.trim() || undefined
            : undefined,
        width,
        height,
        num_inference_steps: steps,
        guidance_scale: guidance,
        seed,
      } satisfies GenerateImageRequest),
    });

    if (!modalResponse.ok) {
      const message = await modalResponse.text().catch(() => "");
      return invalid(
        message ? `Generation failed: ${message.slice(0, 500)}` : "Generation failed",
        502,
      );
    }

    const image = await modalResponse.arrayBuffer();
    const contentType = modalResponse.headers.get("content-type") ?? "image/png";

    // Only charge after Modal successfully returns the image. Nothing is persisted.
    const charged = await prisma.user.updateMany({
      where: { id: session.user.id, credits: { gte: 1 } },
      data: { credits: { decrement: 1 } },
    });

    if (charged.count !== 1) return invalid("Insufficient credits", 402);

    return new Response(image, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition":
          modalResponse.headers.get("content-disposition") ??
          'inline; filename="generated-image.png"',
        "X-Seed": modalResponse.headers.get("x-seed") ?? "",
        "X-Model-ID": modalResponse.headers.get("x-model-id") ?? "",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return invalid("Internal server error", 500);
  }
}
