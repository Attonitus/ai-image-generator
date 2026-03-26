"use server"

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";


interface GenerateImageData {
    prompt: string;
    negative_prompt?: string;
    width: number;
    height: number;
    num_inference_steps?: number;
    guidance_scale?: number;
    seed?: number;
    attention_backend?: string;
}

interface GenerateImageResult {
    success: boolean;
    s3_key?: string;
    imageUrl?: string;
    projectId?: string;
    seed?: number;
    modelId?: string;
    error?: string;
}

interface ResponseResult {
    image_s3_key: string;
    image_url: string;
    seed: number;
    model_id: string
}


export const generateImageAction = async (data: GenerateImageData): Promise<GenerateImageResult>  => {
    try {
        if (!process.env.MODAL_ZIMAGE_URL) return { success: false, error: "MODAL_ZIMAGE_URL is not set" }

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user.id) return { success: false, error: "Unauthorized" };
        if (!data.prompt || !data.width || !data.height) return { success: false, error: "Missing required fields" };

        const creditsNeeded = 1;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true }
        });

        if (!user) return { success: false, error: "User not exist" };
        if (user.credits < creditsNeeded) return { success: false, error: "Insufficient credits." }

        const response = await fetch(process.env.MODAL_ZIMAGE_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            return { success: false, error: text ? `Generation failed: ${text}` : "Failed to generate image" }
        }

        const result: ResponseResult = await response.json();

        const [, imageProject] = await prisma.$transaction([
            prisma.user.update({
                where: { id: session.user.id },
                data: { credits: { decrement: creditsNeeded } }
            }),
            prisma.imageProject.create({
                data: {
                    prompt: data.prompt,
                    negativePrompt: data.negative_prompt,
                    imageUrl: result.image_url,
                    s3Key: result.image_s3_key,
                    width: data.width,
                    height: data.height,
                    numInferenceSteps: data.num_inference_steps ?? 9,
                    guidanceScale: data.guidance_scale ?? 0,
                    seed: BigInt(result.seed),
                    modelId: result.model_id,
                    userId: session.user.id

                }
            })
        ]);

        return {
            success: true,
            s3_key: result.image_s3_key,
            imageUrl: result.image_url,
            seed: result.seed,
            modelId: result.model_id,
            projectId: imageProject.id
        }

    } catch (error) {
        console.error("Image generation error: ", error);
        return { success: false, error: "Internal server error" };
    }
}

export const getUserImageProjectsAction = async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user.id) return { success: false, error: "Unauthorized" };

        const imageProjects = await prisma.imageProject.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        // big int arent serializable convert seed to number
        const safeProjects = imageProjects.map((project) => ({
            ...project,
            seed: Number(project.seed)
        }));

        return { success: true, imageProjects: safeProjects };

    } catch (error) {
        console.error("Error fetching image projects", error);
        return { success: false, error: "Failed to fetch image projects" }
    }
}

export const deleteImageProjectAction = async(id: string) => {

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user.id) return { success: false, error: "Unauthorized" };
        const project = await prisma.imageProject.findUnique({ where: { id } });

        if (!project || project.userId !== session.user.id) return { success: false, error: "Not found or unauthorized" };

        await prisma.imageProject.delete({ where: { id } });
        return { success: true }
    } catch (error) {
        console.error("Error deleting image projects");
        return { success: false, error: "Failed to delete image project" };
    }
}