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

    private static _rendering = false;

    /**
     * Inject the toolbar into the chat controls.
     */
    static async render(_html?: any): Promise<void> {
        if (this._rendering) return;
        this._rendering = true;

        const MAX_RETRIES = 20; // Reduced to 2s
        let retries = 0;
        let chatControls: HTMLElement | null = null;
        let controlButtons: Element | null = null;

        try {
            while (retries < MAX_RETRIES) {
                chatControls = document.getElementById("chat-controls");
                if (chatControls) {
                    controlButtons = chatControls.querySelector(".control-buttons");
                    if (controlButtons) break;
                }
                // Wait 100ms and try again
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (!chatControls || !controlButtons) {
                // console.warn(`FFTweaks | AINarratorToolbar | Failed to find element after ${retries} retries`);
                return;
            }
            
            // ... render logic ...


        // console.log(`FFTweaks | AINarratorToolbar | Found elements after ${retries} retries`);

        // Remove existing if any
        const existingBtn = controlButtons.querySelector(".ai-narrator-trigger");
        if (existingBtn) existingBtn.remove();
        const existingPanel = document.getElementById("ai-narrator-panel");
        if (existingPanel) existingPanel.remove();

        // Create the trigger button matching Foundry's style
        const triggerBtn = document.createElement("button");
        triggerBtn.type = "button";
        triggerBtn.className = "ui-control icon ai-narrator-trigger";
        triggerBtn.dataset.tooltip = "AI Narrator";
        triggerBtn.ariaLabel = "AI Narrator";
        triggerBtn.innerHTML = `<i class="fas fa-hat-wizard"></i>`;
        triggerBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            AINarratorToolbar.togglePanel();
        });

        // Prepend or append to control buttons? Append seems standard.
        controlButtons.appendChild(triggerBtn);

        // Create the popup panel (attached to body or chat-controls to avoid overflow issues, 
        // but let's try appending to chat-controls with absolute positioning first)
        const panel = document.createElement("div");
        panel.id = "ai-narrator-panel";
        panel.className = "ai-narrator-panel-popup"; // Renamed class for specific styling
        panel.style.display = "none";

        // — Combat Narration Toggle —
        const combatToggle = AINarratorToolbar.createToggle(
            "ai-combat-narration",
            "Combat Narration",
            "fas fa-fist-raised",
            game.settings.get(MODULE_ID as any, `${PLUGIN_ID}.enabled`) === true,
            (enabled: boolean) => {
                game.settings.set(MODULE_ID as any, `${PLUGIN_ID}.enabled`, enabled);
            }
        );
        panel.appendChild(combatToggle);

        // Append panel to control-buttons so we can position relative to the button row
        controlButtons.appendChild(panel);

        AINarratorToolbar.toolbar = controlButtons as HTMLElement; // storing parent helper
        AINarratorToolbar.panel = panel;

        // Close panel when clicking outside
        document.addEventListener("click", (e) => {
            if (AINarratorToolbar.isExpanded && 
                !panel.contains(e.target as Node) && 
                !triggerBtn.contains(e.target as Node)) {
                AINarratorToolbar.togglePanel(false);
            }
        });

        // console.log("FFTweaks | AINarratorToolbar | Rendered in chat controls");
        } finally {
            this._rendering = false;
        }
    }

    /**
     * Toggle the expandable panel open/closed.
     */
    private static togglePanel(force?: boolean): void {
        if (!AINarratorToolbar.panel) return;

        AINarratorToolbar.isExpanded = force !== undefined ? force : !AINarratorToolbar.isExpanded;
        AINarratorToolbar.panel.style.display = AINarratorToolbar.isExpanded ? "flex" : "none";

        // Update trigger button active state
        const trigger = document.querySelector(".ai-narrator-trigger");
        if (trigger) {
            trigger.classList.toggle("active", AINarratorToolbar.isExpanded);
            // Foundry style active state
            if (AINarratorToolbar.isExpanded) trigger.classList.add("active");
            else trigger.classList.remove("active");
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
