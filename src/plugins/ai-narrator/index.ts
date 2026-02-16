// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";

declare global {
  interface HOOKS {
    "dnd5e.useItem": (item: any, config: any, options: any) => void;
  }
}

const MODULE_ID = "fftweaks";
const PLUGIN_ID = "ai-narrator";

export const AINarrator = {
  initialize: () => {
    console.log("FFTweaks | AI Narrator | Initializing...");
    // Register settings
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
      onChange: () => {
        // Debounced reload or just let it be re-read on next use
      },
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
        hint: "Customize the prompt sent to the AI. Use placeholders like {actor}, {item}, {targets}, {result}.",
        scope: "world",
        config: true,
        type: String,
        default: "Describe the action of {actor} using {item} against {targets}. The result was {result}. Answer in {language}. Write ONLY the narrative description in the first person perspective of {actor}. Keep it to exactly one short, exciting sentence.",
    });

    // Hook into item usage
    // Hook into midi-qol RollComplete if available
    Hooks.on("midi-qol.RollComplete" as any, async (workflow: any) => {
        console.log("FFTweaks | AI Narrator | midi-qol.RollComplete fired", workflow);
        
        const enabledSetting = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.enabled`);
        const isEnabled = enabledSetting === true || enabledSetting === "true";
        console.log(`FFTweaks | AI Narrator | Enabled: ${enabledSetting} (${typeof enabledSetting}) -> ${isEnabled}`);
        
        if (!isEnabled) return;

        const apiKey = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.apiKey`) as string;
        if (!apiKey) {
             console.warn("FFTweaks | AI Narrator | No API Key found");
             return;
        }

        const actor = workflow.actor;
        const item = workflow.item;
        
        console.log(`FFTweaks | AI Narrator | Item Type: ${item.type}`);
        // Skip minor actions if needed, or filter by item type
        if (!["weapon", "spell", "feat"].includes(item.type)) {
            console.log("FFTweaks | AI Narrator | Skipping item type:", item.type);
            return;
        }

        const targets = Array.from(workflow.targets).map((t: any) => t.name).join(", ") || "the air";
        const hitTargets = Array.from(workflow.hitTargets).map((t: any) => t.name);
        
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

        const language = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.language`) as string;
        const promptTemplate = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.prompt`) as string;
        
        // Construct the prompt by combining the user template with mandatory instructions
        // We append the instructions effectively enforcing them even if the user has an old template saved.
        let prompt = promptTemplate
            .replace("{actor}", actor.name)
            .replace("{item}", item.name)
            .replace("{targets}", targets)
            .replace("{result}", resultText);
            
        // Forcibly append instructions to ensure settings are respected
        const isPC = actor.type === "character";
        const perspective = isPC ? "FIRST PERSON" : "THIRD PERSON";
        const perspectiveExample = isPC ? '(e.g. "I swing", not "I swung")' : `(e.g. "${actor.name} swings", not "${actor.name} swung")`;
        
        prompt += ` Answer in ${language} (if Spanish, use Neutral/Latin American Spanish). Write a single, concise sentence in the style of a high-quality fantasy novel. Describe the physical action and impact in the ${perspective} PRESENT TENSE ${perspectiveExample}. Do not describe feelings, only the action.`;

        try {
            console.log("FFTweaks | AI Narrator | Sending prompt to AI...", prompt);
            
            // Create a pending ChatMessage immediately
            const chatMessage = await ChatMessage.create({
                content: `<div class="ai-narrator-response"><i class="fas fa-spinner fa-spin"></i> Consulting the spirits...</div>`,
                whisper: [game.user.id],
                speaker: ChatMessage.getSpeaker({ alias: "AI" }),
            });

            const genAI = new GoogleGenerativeAI(apiKey);
            let modelId = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.model`) as string;
            
            // Auto-upgrade legacy model selections to Gemini 3 IF they are old 1.5 models
            if (modelId) {
                // Only upgrade if it's NOT a Gemini 3 or Gemini 2 model
                if (!modelId.includes("gemini-3") && !modelId.includes("gemini-2")) {
                     if (modelId.includes("pro")) modelId = "gemini-3-pro-preview";
                     else modelId = "gemini-3-flash-preview";
                }
            } else {
                 modelId = "gemini-3-flash-preview";
            }

            const model = genAI.getGenerativeModel({ model: modelId });

            console.log(`FFTweaks | AI Narrator | Calling generateContent with model: ${modelId}`);
            const result = await model.generateContent(prompt);
            console.log("FFTweaks | AI Narrator | generateContent result received:", result);
            
            const response = result.response;
            const text = response.text();
            console.log("FFTweaks | AI Narrator | AI Response Text:", text);

            // Calculate Cost
            let costString = "";
            try {
                const usage = response.usageMetadata;
                if (usage) {
                    const inputTokens = usage.promptTokenCount || 0;
                    const outputTokens = usage.candidatesTokenCount || 0;
                    
                    // Pricing (Estimate per 1M tokens) - Update as needed
                    // Flash: ~$0.10 input / $0.40 output (blended safe estimate)
                    // Pro: ~$3.50 input / $10.50 output
                    let inputRate = 0.10;
                    let outputRate = 0.40;
                    
                    if (modelId.includes("pro")) {
                        inputRate = 3.50;
                        outputRate = 10.50;
                    }

                    const cost = ((inputTokens / 1_000_000) * inputRate) + ((outputTokens / 1_000_000) * outputRate);
                    // const costMicros = cost * 100; // cents (unused)
                    // Show generic extremely low cost if < 0.0001
                    const costDisplay = cost < 0.0001 ? "<$0.0001" : `$${cost.toFixed(5)}`;
                    
                    costString = `<div style="font-size: 0.7em; color: #888; text-align: right; margin-top: 4px;">
                        Tokens: ${inputTokens} + ${outputTokens} | Est. Cost: ${costDisplay}
                    </div>`;
                }
            } catch (e) {
                console.warn("FFTweaks | AI Narrator | Failed to calculate cost:", e);
            }

            if (text) {
                console.log("FFTweaks | AI Narrator | Updating ChatMessage...");
                if (chatMessage) {
                    await chatMessage.update({
                        content: `<div class="ai-narrator-response"><b>AI Narrator:</b> ${text}</div>${costString}`
                    });
                }
                console.log("FFTweaks | AI Narrator | ChatMessage updated.");
            } else {
                console.warn("FFTweaks | AI Narrator | Text response was empty.");
                if (chatMessage) await chatMessage.delete();
            }
        } catch (error) {
            console.error("AI Narrator Error:", error);
            (ui as any).notifications.warn("AI Narrator failed. Check console.");
        }
    });

    // Fallback for non-midi rolls (dnd5e.useItem)
    Hooks.on("dnd5e.useItem" as any, async (item: any, config: any, options: any) => {
        // If midi-qol is active, let it handle the narration to avoid duplicates
        if (game.modules.get("midi-qol")?.active) return;
        
        console.log("FFTweaks | AI Narrator | dnd5e.useItem fired (Fallback)", item.name);
        
        const enabledSetting = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.enabled`);
        const isEnabled = enabledSetting === true || enabledSetting === "true";
        if (!isEnabled) return;
        
        const apiKey = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.apiKey`) as string;
        if (!apiKey) return;

        const actor = item.actor;
        const targets = [...(game.user as any).targets].map((t: any) => t.name).join(", ") || "the air";
        
        const language = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.language`) as string;
        const promptTemplate = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.prompt`) as string;
        let prompt = promptTemplate
            .replace("{actor}", actor.name)
            .replace("{item}", item.name)
            .replace("{targets}", targets)
            .replace("{result}", "an attempt");
            
        // Forcibly append instructions to ensure settings are respected
        const isPC = actor.type === "character";
        const perspective = isPC ? "FIRST PERSON" : "THIRD PERSON";
        const perspectiveExample = isPC ? '(e.g. "I swing", not "I swung")' : `(e.g. "${actor.name} swings", not "${actor.name} swung")`;
        
        prompt += ` Answer in ${language} (if Spanish, use Neutral/Latin American Spanish). Write a single, concise sentence in the style of a high-quality fantasy novel. Describe the physical action and impact in the ${perspective} PRESENT TENSE ${perspectiveExample}. Do not describe feelings, only the action.`;

         try {
            // Create a pending ChatMessage immediately
            const chatMessage = await ChatMessage.create({
                content: `<div class="ai-narrator-response"><i class="fas fa-spinner fa-spin"></i> Consulting the spirits...</div>`,
                whisper: [game.user.id],
                speaker: ChatMessage.getSpeaker({ alias: "AI" }),
            });

            const genAI = new GoogleGenerativeAI(apiKey);
            let modelId = game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.model`) as string;
            
            // Auto-fix common model ID issues
            if (modelId === "gemini-1.5-flash") modelId = "gemini-1.5-flash-latest";
            if (modelId === "gemini-1.5-pro") modelId = "gemini-1.5-pro-latest";

            const model = genAI.getGenerativeModel({ model: modelId });

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            if (text && chatMessage) {
                 await chatMessage.update({
                    content: `<div class="ai-narrator-response"><b>AI Narrator:</b> ${text}</div>`,
                });
            } else if (chatMessage) {
                 await chatMessage.delete();
            }
        } catch (error) {
            console.error("AI Narrator Error:", error);
        }
    });

    // We might also want to hook into ChatMessage creation to catch rolls specifically if useItem doesn't cover actual dice rolls well enough.
    // For now, useItem is a good start for "I cast Fireball", even before damage is rolled.
  }
};
