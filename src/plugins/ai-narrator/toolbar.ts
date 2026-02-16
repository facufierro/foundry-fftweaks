// @ts-nocheck

const MODULE_ID = "fftweaks";
const PLUGIN_ID = "ai-narrator";

/**
 * AINarratorToolbar — Expandable button bar above the chat input.
 * Provides toggle switches for AI features.
 */
export class AINarratorToolbar {
    private static toolbar: HTMLElement | null = null;
    private static panel: HTMLElement | null = null;
    private static isExpanded = false;

    /**
     * Inject the toolbar into the chat sidebar.
     */
    static render(): void {
        // Wait for the chat form to exist
        const chatForm = document.getElementById("chat-form");
        if (!chatForm) {
            console.warn("FFTweaks | AINarratorToolbar | #chat-form not found");
            return;
        }

        // Remove existing toolbar if re-rendering
        const existing = document.getElementById("ai-narrator-toolbar");
        if (existing) existing.remove();

        // Create the main toolbar container
        const toolbar = document.createElement("div");
        toolbar.id = "ai-narrator-toolbar";
        toolbar.className = "ai-narrator-toolbar";

        // Create the trigger button (always visible)
        const triggerBtn = document.createElement("button");
        triggerBtn.type = "button";
        triggerBtn.className = "ai-narrator-trigger";
        triggerBtn.title = "AI Narrator";
        triggerBtn.innerHTML = `<i class="fas fa-hat-wizard"></i>`;
        triggerBtn.addEventListener("click", () => AINarratorToolbar.togglePanel());
        toolbar.appendChild(triggerBtn);

        // Create the expandable panel
        const panel = document.createElement("div");
        panel.className = "ai-narrator-panel";
        panel.style.display = "none";

        // — Combat Narration Toggle —
        const combatToggle = AINarratorToolbar.createToggle(
            "ai-combat-narration",
            "Combat Narration",
            "fas fa-fist-raised",
            game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.enabled`) === true,
            (enabled: boolean) => {
                game.settings.set(MODULE_ID as any, `${PLUGIN_ID}.enabled`, enabled);
                console.log(`FFTweaks | AINarratorToolbar | Combat Narration: ${enabled}`);
            }
        );
        panel.appendChild(combatToggle);

        // — Placeholder: Message Embellishment (future feature) —
        // const embellishToggle = AINarratorToolbar.createToggle(...)
        // panel.appendChild(embellishToggle);

        toolbar.appendChild(panel);

        // Insert above the chat form
        chatForm.parentElement?.insertBefore(toolbar, chatForm);

        AINarratorToolbar.toolbar = toolbar;
        AINarratorToolbar.panel = panel;

        console.log("FFTweaks | AINarratorToolbar | Rendered");
    }

    /**
     * Toggle the expandable panel open/closed.
     */
    private static togglePanel(): void {
        if (!AINarratorToolbar.panel) return;

        AINarratorToolbar.isExpanded = !AINarratorToolbar.isExpanded;
        AINarratorToolbar.panel.style.display = AINarratorToolbar.isExpanded ? "flex" : "none";

        // Update trigger button active state
        const trigger = AINarratorToolbar.toolbar?.querySelector(".ai-narrator-trigger");
        if (trigger) {
            trigger.classList.toggle("active", AINarratorToolbar.isExpanded);
        }
    }

    /**
     * Create a toggle switch element.
     */
    private static createToggle(
        id: string,
        label: string,
        icon: string,
        initialState: boolean,
        onChange: (enabled: boolean) => void
    ): HTMLElement {
        const container = document.createElement("div");
        container.className = "ai-narrator-toggle";

        const iconEl = document.createElement("i");
        iconEl.className = icon;
        container.appendChild(iconEl);

        const labelEl = document.createElement("span");
        labelEl.className = "ai-narrator-toggle-label";
        labelEl.textContent = label;
        container.appendChild(labelEl);

        const switchEl = document.createElement("label");
        switchEl.className = "ai-narrator-switch";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;
        input.checked = initialState;
        input.addEventListener("change", () => onChange(input.checked));
        switchEl.appendChild(input);

        const slider = document.createElement("span");
        slider.className = "ai-narrator-slider";
        switchEl.appendChild(slider);

        container.appendChild(switchEl);
        return container;
    }
}
