// @ts-nocheck
import { AIService } from "../../utils/ai-service";

const MODULE_ID = "fftweaks";
const PLUGIN_ID = "ai-narrator";

export class MessageImprovement {

    /**
     * Intercept chat messages to improve them with AI.
     * Hook: chatMessage
     */
    static async onChatMessage(chatLog: any, message: string, chatData: any): Promise<boolean> {
        // 1. Check if feature is enabled
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
        MessageImprovement.processMessage(message);
        return false;
    }

    private static async processMessage(originalText: string): Promise<void> {
        // Create a pending message for feedback
        const user = game.user;
        const speaker = ChatMessage.getSpeaker();
        
        const pendingMessage = await ChatMessage.create({
            content: `<div class="ai-narrator-response"><i class="fas fa-spinner fa-spin"></i> Refining message...</div>`,
            speaker: speaker,
            type: CONST.CHAT_MESSAGE_TYPES.IC // Assume IC for improvements? Or OOC?
        });

        try {
            const actor = user.character || { name: user.name };
            const prompt = MessageImprovement.buildPrompt(actor, originalText);
            
            console.log("FFTweaks | MessageImprovement | Prompt:", prompt);
            
            const result = await AIService.generate(prompt);
            
            if (result.text && pendingMessage) {
                const costHtml = AIService.formatCostHtml(result.usage, result.modelId);
                await pendingMessage.update({
                    content: result.text + costHtml // Replace content with AI version
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

    private static buildPrompt(actor: any, originalText: string): string {
        const language = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.language`) as string;
        
        // Context about the speaker
        const isPC = actor.hasPlayerOwner; // simple check
        const perspective = "FIRST PERSON"; // User messages are usually first person ("I do x")
        
        return `Rewrite the following RPG chat message to be more immersive, descriptive, and engaging.
        
        Speaker: ${actor.name}
        Original Message: "${originalText}"
        
        Constraints:
        - Keep the meaning exactly the same, but improve the prose.
        - Write in ${perspective} perspective (e.g. "I...").
        - Use ${language} (if Spanish, use Neutral/Latin American Spanish).
        - Be concise (1-2 sentences max).
        - Do not add actions that weren't implied.
        - Output ONLY the rewritten message, no quotes.
        `;
    }
}
