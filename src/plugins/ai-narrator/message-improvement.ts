// @ts-nocheck
import { AIService } from "../../utils/ai-service";

const MODULE_ID = "fftweaks";
const PLUGIN_ID = "ai-narrator";

export class MessageImprovement {

    /**
     * Intercept chat messages to improve them with AI.
     * Hook: chatMessage
     */
    static onChatMessage(chatLog: any, message: string, chatData: any): boolean {
        // 1. Check if feature is enabled
        // Note: game.settings.get is synchronous
        const isEnabled = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.improve_messages`);
        if (!isEnabled) return true; // Let original message pass

        // 2. Check for API Key
        if (!AIService.getApiKey()) return true;

        // 3. Skip commands (starts with /)
        if (message.trim().startsWith("/")) return true;

        // 4. Skip empty messages
        if (!message.trim()) return true;

        // 5. Intercept!
        // We return false to stop Foundry from processing the message.
        // Then we process it ourselves asynchronously.
        // IMPORTANT: This function MUST be synchronous for the return false to work.
        MessageImprovement.processMessage(message);

        // Manually clear chat input so it looks like it was "sent" (and vanishes from input)
        // Set a small timeout to ensure it clears after the event loop
        setTimeout(() => {
            if (ui.chat && ui.chat.element) {
                ui.chat.element.find("#chat-message").val("");
            }
        }, 0);

        return false;
    }

    private static async processMessage(originalText: string): Promise<void> {
        // Create a pending message for feedback
        const user = game.user;
        const speaker = ChatMessage.getSpeaker();
        
        const pendingMessage = await ChatMessage.create({
            content: `<div class="ai-narrator-response"><i class="fas fa-spinner fa-spin"></i> Refining message...</div>`,
            speaker: speaker,
            type: CONST.CHAT_MESSAGE_TYPES.IC,
            whisper: [game.user.id] // Whisper to self while processing
        });

        try {
            // Determine Context
            const selectedTokens = canvas.tokens.controlled;
            let actor = null;
            if (selectedTokens.length > 0) {
                actor = selectedTokens[0].actor;
            } else {
                actor = user.character; // Fallback to assigned character
            }

            const isGM = user.isGM;
            // Check if actual Player Character (for roll suggestions)
            const isPC = actor && (actor.hasPlayerOwner || actor.type === "character");

            const prompt = MessageImprovement.buildPrompt(actor, originalText, isGM, selectedTokens.length > 0, isPC);
            
            const result = await AIService.generate(prompt);
            
            if (result.text && pendingMessage) {
                const costHtml = AIService.formatCostHtml(result.usage, result.modelId);
                
                // Update the outcome. 
                // We keep the whisper recipients from creation (Self Only) to keep it private.
                
                await pendingMessage.update({
                    content: result.text + costHtml
                });
            } else {
                // Fallback if empty result
                await pendingMessage.update({
                     content: originalText
                });
            }
        } catch (error) {
            console.error("FFTweaks | MessageImprovement | Error:", error);
            // Revert to original text if error
            if (pendingMessage) {
                await pendingMessage.update({
                    content: originalText
                });
                ui.notifications.error("AI Improvement failed. Original message restored.");
            }
        }
    }

    private static buildPrompt(actor: any, originalText: string, isGM: boolean, hasSelection: boolean, isPC: boolean): string {
        const language = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.language`) as string;
        
        // TERM CONSTRAINT
        const termConstraint = "CRITICAL: Keep all Game Terms (Skill names, Spells, Items, 'Check', 'Saving Throw') in ENGLISH. Do not translate them even if writing in another language.";

        // COMMON CONSTRAINTS
        const commonConstraints = `
        CRITICAL INSTRUCTIONS:
        1. Output ONLY the rewritten message. NO introductory text. NO quotes.
        2. Do NOT hallucinate equipment, traits, or actions.
        3. ${termConstraint}
        4. Language: ${language}.
        `;

        // 1. SCENE MODE (GM + No Selection)
        if (isGM && !hasSelection) {
            return `Role: Game Master Narrator.
            Task: Describe the scene/atmosphere based on this note.
            Input: "${originalText}"
            
            Guidelines:
            - Neutral, atmospheric tone.
            - Third-person omniscient.
            - Length: Approximately 2 sentences.
            ${commonConstraints}
            `;
        }

        // Gather Personality Traits
        const name = actor ? actor.name : "The Character";
        const system = actor?.system || {};
        const details = system.details || {};
        
        const bio = (details.biography?.value || "").replace(/<[^>]*>?/gm, "").substring(0, 300);
        const traits = details.trait || "";
        const ideal = details.ideal || "";
        const bond = details.bond || "";
        const flaw = details.flaw || "";
        
        let characterContext = "";
        if (bio) characterContext += `Biography: ${bio}\n`;
        if (traits) characterContext += `Personality Traits: ${traits}\n`;
        if (ideal) characterContext += `Ideal: ${ideal}\n`;
        if (bond) characterContext += `Bond: ${bond}\n`;
        if (flaw) characterContext += `Flaw: ${flaw}\n`;

        // Identify if it's a Dialogue or Action
        const lowerText = originalText.toLowerCase();
        const dialogueTriggers = ["i say", "say", "digo", "dice", "says", "he says", "she says"];
        const isDialogue = dialogueTriggers.some(trigger => lowerText.startsWith(trigger));

        if (isDialogue) {
            // DIALOGUE MODE
            return `Role: RPG Character (${name}).
            Task: Rewrite this dialogue to match your personality.
            
            Character Context:
            ${characterContext}

            Input: "${originalText}"
            
            Guidelines:
            - Remove frames like "I say". Just output the spoken text.
            - Incorporate traits/flaws/voice into the phrasing if applicable.
            - Length: Strictly 1 sentence (unless input is very long).
            ${commonConstraints}
            `;
        } else {
            // ACTION MODE
            // Suggestion ONLY for PC tokens
            const rollInstruction = isPC 
                ? "If and ONLY if the action CLEARLY requires a specific skill check (e.g. attempting to hide, climb, decipher), append '[Suggestion: <English Skill Name> Check]'. Do NOT suggest for basic actions." 
                : "Do NOT suggest rolls.";
            
            return `Role: RPG Character (${name}).
            Task: Rewrite this action slightly to improve prose, but keep it brief.
            
            Character Context:
            ${characterContext}

            Input: "${originalText}"
            
            Guidelines:
            - Perspective: ${isPC ? "First Person (I...)" : "Third Person (He/She/The Creature...)"}.
            - Length: Strictly 1 sentence.
            - ${rollInstruction}
            ${commonConstraints}
            `;
        }
    }
}
