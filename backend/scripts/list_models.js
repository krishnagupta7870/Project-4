import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // For listing models, we don't need a specific model instance, 
        // but the SDK structure usually involves getting the model manager or similar?
        // Actually SDK doesn't have direct listModels on top level in v0.1.X or v0.2.X sometimes.
        // Let's rely on standard fetch if SDK doesn't expose it easily, OR assume SDK usage.
        // Wait, recent SDKs might not expose listModels directly.
        // Let's try to just hit the API endpoint with fetch to be sure.

        // Using simple fetch to debug environment independent of SDK version nuances
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log("No API Key found");
            return;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models returned or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
