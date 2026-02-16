// @ts-nocheck
import { CombatNarration } from "./combat-narration";

const MODULE_ID = "fftweaks";
const PLUGIN_ID = "ai-narrator";

/**
 * AINarrator — Orchestrator class.
 * Registers settings and hooks. Delegates all logic to handler modules.
 */
export class AINarrator {

    static initialize(): void {
        console.log("FFTweaks | AI Narrator | Initializing...");

        AINarrator.registerSettings();
        AINarrator.registerHooks();
    }

    /**
     * Register all module settings for the AI Narrator.
     */
    private static registerSettings(): void {
        game.settings.register(MODULE_ID as any, `${PLUGIN_ID}.enabled`, {
            name: "Enable AI Narrator",
            hint: "Enables AI-generated combat descriptions.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false,
        });

        game.settings.register(MODULE_ID as any, `${PLUGIN_ID}.apiKey`, {
            name: "Google AI API Key",
            hint: "Enter your Google AI Studio API Key (Gemini).",
            scope: "client",
            config: true,
            type: String,
            default: "",
        });

        game.settings.register(MODULE_ID as any, `${PLUGIN_ID}.model`, {
            name: "AI Model",
            hint: "Select the Gemini model to use. 'Flash' models are faster and cheaper.",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "gemini-3-flash-preview": "Gemini 3 Flash Preview (Recommended)",
                "gemini-3-pro-preview": "Gemini 3 Pro Preview (Powerful)",
                "gemini-2.0-flash": "Gemini 2.0 Flash (Reliable Fallback)",
            },
            default: "gemini-3-flash-preview",
        });

        game.settings.register(MODULE_ID as any, `${PLUGIN_ID}.language`, {
            name: "Language",
            hint: "Select the language for the AI response.",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "english": "English",
                "spanish": "Spanish",
            },
            default: "english",
        });

        game.settings.register(MODULE_ID as any, `${PLUGIN_ID}.prompt`, {
            name: "Prompt Template",
            hint: "Customize the prompt sent to the AI. Use placeholders: {actor}, {item}, {targets}, {result}.",
            scope: "world",
            config: true,
            type: String,
            default: "Describe the action of {actor} using {item} against {targets}. The result was {result}.",
        });
    }

    /**
     * Register all hooks and delegate to handler modules.
     */
    private static registerHooks(): void {
        // Primary: midi-qol integration (detailed combat info)
        Hooks.on("midi-qol.RollComplete" as any, CombatNarration.onRollComplete);

        // Fallback: dnd5e.useItem (when midi-qol is not active)
        Hooks.on("dnd5e.useItem" as any, CombatNarration.onUseItem);
    }
}
