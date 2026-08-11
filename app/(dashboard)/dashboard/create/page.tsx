"use client";

import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ImageSettings from "@/components/create/image-settings";
import PromptInput from "@/components/create/prompt-input";


export interface GeneratedImage {
    imageUrl: string;
    prompt: string;
    seed: number;
    modelId: string;
}

export default function CreatePage() {

    const [isGenerating, setIsGenerating] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [negativePrompt, setNegativePrompt] = useState("");
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(1024);
    const [numInferenceSteps, setNumInferenceSteps] = useState(9);
    const [guidanceScale, setGuidanceScale] = useState(0);
    const [seed, setSeed] = useState("");
    const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
    const imageUrlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
        };
    }, []);

    const generateImage = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt!");
            return;
        }

        if (prompt.trim().length < 2) {
            toast.error("Please enter a prompt 2 characters long!");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    negative_prompt: negativePrompt.trim()
                        ? negativePrompt.trim()
                        : undefined,
                    width,
                    height,
                    num_inference_steps: numInferenceSteps,
                    guidance_scale: guidanceScale,
                    seed: seed.trim() ? parseInt(seed, 10) : undefined,
                }),
            });

            if (!response.ok) {
                const result = await response.json().catch(() => null);
                throw new Error(result?.error ?? "Generation failed");
            }

            const imageUrl = URL.createObjectURL(await response.blob());
            if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
            imageUrlRef.current = imageUrl;

            const newImage: GeneratedImage = {
                imageUrl,
                prompt,
                seed: Number(response.headers.get("x-seed") ?? seed) || 0,
                modelId: response.headers.get("x-model-id") ?? "Tongyi-MAI/Z-Image-Turbo",
            };

            setCurrentImage(newImage);

            toast.success("Image generated successfully!");
        } catch (error) {
            console.error("Generation error:", error);
            const errorMessage =
                error instanceof Error ? error.message : "Failed to generate image";
            toast.error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <RedirectToSignIn />
            <SignedIn>
                <div className="min-h-screen">
                    {/* Top Navbar */}
                    <div className="border-b border-gray-200 bg-white py-2">
                        <div className="mx-auto max-w-7xl text-center">
                            <h1 className="from-primary to-primary/70 mb-1 bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent">
                                Text-to-Image Generator
                            </h1>
                            <p className="text-muted-foreground mx-auto max-w-xl text-xs">
                                Generate images from text prompts
                            </p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6">
                        <div className="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-3">
                            {/* Left Side - Controls (1/3 width) */}
                            <div className="order-2 space-y-2 sm:space-y-3 lg:order-1 lg:col-span-1">
                                <ImageSettings
                                    prompt={prompt}
                                    width={width}
                                    setWidth={setWidth}
                                    height={height}
                                    setHeight={setHeight}
                                    numInferenceSteps={numInferenceSteps}
                                    setNumInferenceSteps={setNumInferenceSteps}
                                    guidanceScale={guidanceScale}
                                    setGuidanceScale={setGuidanceScale}
                                    seed={seed}
                                    setSeed={setSeed}
                                    isGenerating={isGenerating}
                                    onGenerate={generateImage}
                                />
                            </div>

                            {/* Right Side - Text Input & Preview (2/3 width) */}
                            <div className="order-1 space-y-2 sm:space-y-3 lg:order-2 lg:col-span-2">
                                <PromptInput
                                    prompt={prompt}
                                    setPrompt={setPrompt}
                                    negativePrompt={negativePrompt}
                                    setNegativePrompt={setNegativePrompt}
                                    currentImage={currentImage}
                                    onDownload={(img) => {
                                        const link = document.createElement("a");
                                        link.href = img.imageUrl;
                                        link.download = "generated-image.png";
                                        link.click();
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </SignedIn>
        </>
    );
}
