// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODULE_ID = "fftweaks";
const PLUGIN_ID = "ai-narrator";

export interface AIResult {
    text: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    modelId: string;
}

/**
 * AIService — Pure Gemini API wrapper.
 * No Foundry hooks, no game logic. Just API calls and cost calculation.
 */
export class AIService {

    /**
     * Generate text from a prompt using the configured Gemini model.
     */
    static async generate(prompt: string): Promise<AIResult> {
        const apiKey = AIService.getApiKey();
        if (!apiKey) throw new Error("No API key configured");

        const modelId = AIService.getModelId();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelId });

        console.log(`FFTweaks | AIService | Generating with model: ${modelId}`);
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract usage metadata
        let inputTokens = 0;
        let outputTokens = 0;
        try {
            const usage = response.usageMetadata;
            if (usage) {
                inputTokens = usage.promptTokenCount || 0;
                outputTokens = usage.candidatesTokenCount || 0;
            }
        } catch (e) {
            console.warn("FFTweaks | AIService | Failed to read usage metadata:", e);
        }

        return {
            text,
            usage: { inputTokens, outputTokens },
            modelId,
        };
    }

    /**
     * Get the configured API key.
     */
    static getApiKey(): string {
        return game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.apiKey`) as string;
    }

    /**
     * Get the model ID with auto-upgrade logic for legacy selections.
     */
    static getModelId(): string {
        let modelId = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.model`) as string;

        if (modelId) {
            // Only upgrade if it's NOT a Gemini 3 or Gemini 2 model (legacy 1.5 models)
            if (!modelId.includes("gemini-3") && !modelId.includes("gemini-2")) {
                if (modelId.includes("pro")) modelId = "gemini-3-pro-preview";
                else modelId = "gemini-3-flash-preview";
            }
        } else {
            modelId = "gemini-3-flash-preview";
        }

        return modelId;
    }

    /**
     * Calculate estimated cost from token usage and model ID.
     */
    static calculateCost(usage: { inputTokens: number; outputTokens: number }, modelId: string): number {
        // Pricing (Estimate per 1M tokens)
        // Flash: ~$0.10 input / $0.40 output
        // Pro: ~$3.50 input / $10.50 output
        let inputRate = 0.10;
        let outputRate = 0.40;

        if (modelId.includes("pro")) {
            inputRate = 3.50;
            outputRate = 10.50;
        }

        return ((usage.inputTokens / 1_000_000) * inputRate) + ((usage.outputTokens / 1_000_000) * outputRate);
    }

    /**
     * Format cost info as a small HTML footer for chat messages.
     */
    static formatCostHtml(usage: { inputTokens: number; outputTokens: number }, modelId: string): string {
        try {
            const cost = AIService.calculateCost(usage, modelId);
            const costDisplay = cost < 0.0001 ? "<$0.0001" : `$${cost.toFixed(5)}`;

            return `<div style="font-size: 0.7em; color: #888; text-align: right; margin-top: 4px;">
                Tokens: ${usage.inputTokens} + ${usage.outputTokens} | Est. Cost: ${costDisplay}
            </div>`;
        } catch (e) {
            console.warn("FFTweaks | AIService | Failed to format cost:", e);
            return "";
        }
    }
}
