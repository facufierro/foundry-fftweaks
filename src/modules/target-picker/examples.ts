namespace FFT {
    /**
     * Example usage functions for the Target Picker
     * These can be used in macros or other modules
     */
    export class TargetPickerExamples {
        
        /**
         * Basic target picking - select 2 targets with no range display
         */
        static async basicTargetPicking() {
            const currentToken = canvas.tokens?.controlled[0];
            if (!currentToken) {
                ui.notifications.warn("No token selected");
                return;
            }

            const success = await FFT.TargetPicker.pickTargets(currentToken, 2);
            
            if (success) {
                console.log("Selected targets:", Array.from(game.user?.targets || []));
                ui.notifications.info(`Successfully selected ${game.user?.targets?.size || 0} targets`);
            } else {
                ui.notifications.info("Target selection cancelled");
            }
        }

        /**
         * Target picking with range display
         */
        static async targetPickingWithRanges() {
            const currentToken = canvas.tokens?.controlled[0];
            if (!currentToken) {
                ui.notifications.warn("No token selected");
                return;
            }

            const success = await FFT.TargetPicker.pickTargets(
                currentToken, 
                1, 
                { normal: 30, long: 60 }, // Range in feet/units
                { showRangeDisplay: true }
            );
            
            if (success) {
                ui.notifications.info("Target selected within range");
            }
        }

        /**
         * Advanced target picking with custom options
         */
        static async advancedTargetPicking() {
            const currentToken = canvas.tokens?.controlled[0];
            if (!currentToken) return;

            const picker = new FFT.TargetPicker({
                token: currentToken,
                targets: 3,
                ranges: { normal: 25, long: 50 },
                options: {
                    clearExistingTargets: false, // Don't clear existing targets
                    showGuide: false,            // Don't show tutorial
                    allowManualTargetAdjustment: true, // Allow +/- keys
                    followCursor: true,          // Counter follows mouse
                    showRangeDisplay: true       // Show range visualization
                }
            });

            const result = await picker.promise;
            
            if (result) {
                const targets = Array.from(game.user?.targets || []);
                console.log("Selected targets:", targets);
            }
        }

        /**
         * Target picker with validation - only hostile creatures
         */
        static async hostileTargetPicking() {
            const currentToken = canvas.tokens?.controlled[0];
            if (!currentToken) return;

            // Create custom target picker that validates targets
            const picker = new FFT.TargetPicker({
                token: currentToken,
                targets: 2,
                ranges: { normal: 30 }
            });

            // Hook into the targeting to validate
            const validationHook = Hooks.on("targetToken", (user: any, token: any, targeted: boolean) => {
                if (targeted && token.document.disposition !== CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                    token.setTarget(false, { releaseOthers: false });
                    ui.notifications.warn("You can only target hostile creatures");
                }
            });

            const result = await picker.promise;
            Hooks.off("targetToken", validationHook);
            
            return result;
        }

        /**
         * Create a macro string for Foundry VTT macros
         */
        static createTargetPickerMacroScript(): string {
            return `
// FFT Target Picker Macro
const token = canvas.tokens.controlled[0];
if (!token) {
    ui.notifications.warn("Select a token first");
    return;
}

// Simple dialog for configuration
const content = \`
<form>
    <div class="form-group">
        <label>Number of targets:</label>
        <input type="number" name="targets" value="1" min="1" max="20"/>
    </div>
    <div class="form-group">
        <label>Range (optional):</label>
        <input type="number" name="range" value="30" min="0"/>
    </div>
</form>
\`;

const result = await Dialog.prompt({
    title: "Target Selection",
    content: content,
    callback: (html) => {
        const form = html[0].querySelector("form");
        return new FormData(form);
    }
});

if (result) {
    const targets = parseInt(result.get("targets"));
    const range = parseInt(result.get("range"));
    
    const success = await FFT.TargetPicker.pickTargets(
        token, 
        targets, 
        range > 0 ? { normal: range } : {}
    );
    
    if (success) {
        ui.notifications.info(\`Selected \${game.user.targets.size} targets\`);
    }
}`;
        }

        /**
         * Spell targeting helper for manual spell casting
         */
        static async spellTargeting(item: any): Promise<boolean> {
            const actor = item.actor;
            const token = actor?.getActiveTokens()?.[0];
            
            if (!token) {
                ui.notifications.warn("No token found for this actor");
                return false;
            }

            // Get targeting info from item
            const targetInfo = FFT.TargetPickerModule.getTargetInfo(item);
            if (!targetInfo.needsTargeting) {
                return true; // No targeting needed
            }

            const success = await FFT.TargetPicker.pickTargets(
                token, 
                targetInfo.count, 
                targetInfo.ranges
            );
            
            if (success) {
                // Verify we have enough targets
                const actualTargets = game.user?.targets?.size || 0;
                if (actualTargets >= targetInfo.count) {
                    return true;
                } else {
                    ui.notifications.warn(`Need ${targetInfo.count} targets, only ${actualTargets} selected`);
                    return false;
                }
            }
            
            return false;
        }
    }
}
