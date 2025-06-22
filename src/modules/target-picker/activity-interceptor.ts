/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />

namespace FFT {
    export class ActivityInterceptor {
        private static isTargetPickerActivity = false;
        private static suppressInterceptor = false;

        /**
         * Intercepts the pre-use activity hook to optionally trigger the target picker.
         */
        static onPreUseActivity(activity: any, config: any, options: any): boolean {
            if (this.suppressInterceptor) return true;

            console.log("Activity use intercepted:", activity.name, activity.type);

            if (this.isTargetPickerActivity) {
                console.log("Target picker is already active, skipping:", activity.name);
                return true;
            }

            if (!this.shouldInterceptActivity(activity)) {
                console.log("Activity doesn't need targeting, allowing to proceed:", activity.name);
                return true;
            }

            this.isTargetPickerActivity = true;
            this.startTargetPicker(activity);
            return false;
        }

        /**
         * Determines if the activity should be intercepted for target picking.
         */
        private static shouldInterceptActivity(activity: any): boolean {
            return activity.type === "attack" ||
                (activity.target?.affects?.count && activity.target.affects.count >= 1);
        }

        /**
         * Starts the target picker and handles the activity usage for each selected target.
         */
        private static async startTargetPicker(activity: any): Promise<void> {
            try {
                const token = this.getActorToken(activity);
                const targetCount = this.getTargetCount(activity);
                const range = this.getActivityRange(activity);
                const selection = await TargetPicker.pickTargets(token, targetCount, { normal: range });

                if (selection && typeof selection === "object") {
                    console.log("Target picking successful", selection);
                    this.suppressInterceptor = true;

                    // Build a flat array of targets, repeating as needed
                    const targets: any[] = [];
                    for (const [tokenId, count] of Object.entries(selection)) {
                        const t = canvas.tokens.get(tokenId);
                        if (!t) continue;
                        for (let i = 0; i < count; i++) {
                            targets.push(t);
                        }
                    }

                    // For each target in order, use the corresponding activity
                    for (let i = 0; i < targets.length; i++) {
                        const t = targets[i];
                        // Clear all targets
                        console.debug(`[FFT] Clearing all targets before targeting:`, t.name, t.id);
                        game.user?.targets.forEach(tok => tok.setTarget(false, { releaseOthers: true }));
                        await new Promise(resolve => setTimeout(resolve, 100));
                        // Set only the current token as target
                        console.debug(`[FFT] Setting target:`, t.name, t.id);
                        await t.setTarget(true, { releaseOthers: true });
                        await new Promise(resolve => setTimeout(resolve, 200));
                        // Force UI update (use Hooks.call for compatibility)
                        Hooks.call("targetToken", t, true);
                        const currentTargets = Array.from(game.user?.targets ?? []).map(tok => `${tok.name} (${tok.id})`);
                        console.debug(`[FFT] Current user targets before activity.use():`, currentTargets);
                        // Use the correct activity for this target
                        if (i === 0) {
                            // First use: normal activity
                            console.debug(`[FFT] Using activity:`, activity.name, `on target:`, t.name, t.id);
                            const result = await activity.use();
                            console.debug(`[FFT] Result of activity.use() for target`, t.name, t.id, ':', result);
                        } else {
                            // Subsequent uses: try forward activity first
                            let usedForward = false;
                            const item = activity.item;
                            if (item && item.system?.activities) {
                                const forward = Array.from(item.system.activities.values()).find(
                                    (a: any) => (a as any).type === "forward"
                                );
                                if (forward && typeof (forward as any).use === "function") {
                                    console.debug(`[FFT] Using forward activity for target:`, t.name, t.id);
                                    await (forward as any).use();
                                    usedForward = true;
                                }
                            }
                            if (!usedForward) {
                                console.debug(`[FFT] No forward activity, using main activity again for target:`, t.name, t.id);
                                await activity.use();
                            }
                        }
                        await new Promise(resolve => setTimeout(resolve, 600));
                    }

                    // Optionally, clear all targets after use
                    game.user?.targets.forEach(tok => tok.setTarget(false, { releaseOthers: true }));

                    this.suppressInterceptor = false;
                    this.resetFlag();
                } else {
                    console.log("Target picking cancelled");
                    this.resetFlag();
                }
            } catch (error) {
                console.error("Error in target picker:", error);
                this.suppressInterceptor = false;
                this.resetFlag();
            }
        }

        /**
         * Gets the actor's token for the activity, or falls back to the first controlled token.
         */
        private static getActorToken(activity: any): any {
            return activity.actor?.token?.object || canvas.tokens?.controlled?.[0];
        }

        /**
         * Determines the number of targets required for the activity.
         */
        private static getTargetCount(activity: any): number {
            return activity.type === "attack" ? 1 : (activity.target?.affects?.count || 1);
        }

        /**
         * Gets the range for the activity, defaulting to 30 if not specified.
         */
        private static getActivityRange(activity: any): number {
            return activity.range?.value || 30;
        }

        /**
         * Executes the activity with the provided options.
         */
        private static async executeActivity(activity: any, options: any = {}): Promise<any> {
            try {
                const result = await activity.use(
                    options.usage || {},
                    options.dialog || {},
                    options.message || {}
                );
                console.log("Activity used successfully:", result);
                this.resetFlag();
                return result;
            } catch (error) {
                console.error("Failed to use activity:", error);
                this.resetFlag();
                throw error;
            }
        }

        /**
         * Resets the internal flag for target picker activity.
         */
        private static resetFlag(): void {
            this.isTargetPickerActivity = false;
        }

        /**
         * Forcibly starts the target picker for an activity (for debugging/testing).
         */
        static requiresTargeting(activity: any): boolean {
            console.log(activity);
            this.startTargetPicker(activity);
            return false;
        }

        /**
         * Public method to use an activity with options.
         */
        static async useActivity(activity: any, options: any = {}): Promise<any> {
            return this.executeActivity(activity, options);
        }
    }
}
