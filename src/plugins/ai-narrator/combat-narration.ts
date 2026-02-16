// @ts-nocheck
import { AIService } from "../../utils/ai-service";

const MODULE_ID = "fftweaks";
const PLUGIN_ID = "ai-narrator";

/**
 * CombatNarration — Handles combat-specific message logic.
 * Prompt building, workflow parsing, message creation/update.
 */
export class CombatNarration {

    /**
     * Handler for midi-qol.RollComplete hook.
     */
    static async onRollComplete(workflow: any): Promise<void> {
        console.log("FFTweaks | CombatNarration | midi-qol.RollComplete fired", workflow);

        if (!CombatNarration.isEnabled()) return;
        if (!AIService.getApiKey()) {
            console.warn("FFTweaks | CombatNarration | No API Key found");
            return;
        }

        const actor = workflow.actor;
        const item = workflow.item;

        // Skip non-combat item types
        if (!["weapon", "spell", "feat"].includes(item.type)) {
            console.log("FFTweaks | CombatNarration | Skipping item type:", item.type);
            return;
        }

        const targets = Array.from(workflow.targets).map((t: any) => t.name).join(", ") || "the air";
        const resultText = CombatNarration.parseWorkflowResult(workflow);
        const prompt = CombatNarration.buildPrompt(actor, item, targets, resultText);

        await CombatNarration.generateAndPost(prompt);
    }

    /**
     * Handler for dnd5e.useItem hook (fallback when midi-qol is not active).
     */
    static async onUseItem(item: any, config: any, options: any): Promise<void> {
        // If midi-qol is active, let it handle narration to avoid duplicates
        if (game.modules.get("midi-qol")?.active) return;

        console.log("FFTweaks | CombatNarration | dnd5e.useItem fired (Fallback)", item.name);

        if (!CombatNarration.isEnabled()) return;
        if (!AIService.getApiKey()) return;

        const actor = item.actor;
        const targets = [...(game.user as any).targets].map((t: any) => t.name).join(", ") || "the air";
        const prompt = CombatNarration.buildPrompt(actor, item, targets, "an attempt");

        await CombatNarration.generateAndPost(prompt);
    }

    /**
     * Check if the AI Narrator is enabled.
     */
    private static isEnabled(): boolean {
        const setting = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.enabled`);
        return setting === true || setting === "true";
    }

    /**
     * Parse a midi-qol workflow to extract hit/miss/kill/damage result text.
     */
    static parseWorkflowResult(workflow: any): string {
        let resultText = "an attempt";
        let isKill = false;

        // Detect hits and damage
        if (workflow.hitTargets.size > 0 && workflow.damageRoll) {
            resultText = `a hit dealing ${workflow.damageTotal} damage`;

            // Check for kills if damageList exists
            if (workflow.damageList) {
                for (const damageItem of workflow.damageList) {
                    if (damageItem.newHP <= 0) {
                        isKill = true;
                        break;
                    }
                }
            }
        } else if (workflow.hitTargets.size > 0) {
            resultText = "a hit";
        } else if (workflow.targets.size > 0) {
            resultText = "a miss";
        }

        if (isKill) {
            resultText += " and killing the target";
        }

        return resultText;
    }

    /**
     * Build the full prompt with perspective, language, and style constraints.
     */
    static buildPrompt(actor: any, item: any, targets: string, resultText: string): string {
        const language = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.language`) as string;
        const promptTemplate = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.prompt`) as string;

        let prompt = promptTemplate
            .replace("{actor}", actor.name)
            .replace("{item}", item.name)
            .replace("{targets}", targets)
            .replace("{result}", resultText);

        // Determine perspective based on actor type
        const isPC = actor.type === "character";
        const perspective = isPC ? "FIRST PERSON" : "THIRD PERSON";
        const perspectiveExample = isPC
            ? '(e.g. "I swing", not "I swung")'
            : `(e.g. "${actor.name} swings", not "${actor.name} swung")`;

        // Forcibly append instructions to ensure settings are always respected
        prompt += ` Answer in ${language} (if Spanish, use Neutral/Latin American Spanish). Write a single, concise sentence in the style of a high-quality fantasy novel. Describe the physical action and impact in the ${perspective} PRESENT TENSE ${perspectiveExample}. Do not describe feelings, only the action.`;

        return prompt;
    }

    /**
     * Create a pending "loading" message, generate AI text, then update the message.
     */
    static async generateAndPost(prompt: string): Promise<void> {
        // Create a pending ChatMessage immediately for instant feedback
        const chatMessage = await ChatMessage.create({
            content: `<div class="ai-narrator-response"><i class="fas fa-spinner fa-spin"></i> Consulting the spirits...</div>`,
            whisper: [game.user.id],
            speaker: ChatMessage.getSpeaker({ alias: "AI" }),
        });

        try {
            console.log("FFTweaks | CombatNarration | Sending prompt to AI...", prompt);
            const result = await AIService.generate(prompt);
            console.log("FFTweaks | CombatNarration | AI Response:", result.text);

            if (result.text && chatMessage) {
                const costHtml = AIService.formatCostHtml(result.usage, result.modelId);
                await chatMessage.update({
                    content: `<div class="ai-narrator-response"><b>AI Narrator:</b> ${result.text}</div>${costHtml}`,
                });
            } else if (chatMessage) {
                await chatMessage.delete();
            }
        } catch (error) {
            console.error("FFTweaks | CombatNarration | AI Error:", error);
            if (chatMessage) {
                await chatMessage.update({
                    content: `<div class="ai-narrator-response" style="color: #c44;"><i class="fas fa-exclamation-triangle"></i> AI Narrator failed. Check console.</div>`,
                });
            }
        }
    }
}
