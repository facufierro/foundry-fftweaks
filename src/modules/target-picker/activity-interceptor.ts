/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />

namespace FFT {
    /**
     * Handles intercepting and processing D&D 5e activities for target selection
     */
    export class ActivityInterceptor {
        private static isTargetPickerActivity: boolean = false;
        private static suppressInterceptor: boolean = false;

        /**
         * Handle the dnd5e.preUseActivity hook event
         */
        static onPreUseActivity(activity: any, config: any, options: any): boolean {
            if (this.suppressInterceptor) return true;

            console.log("Activity use intercepted:", activity.name, activity.type);
            
            if (this.isTargetPickerActivity) {
                console.log("Target picker is already active, skipping:", activity.name);
                return true; // Allow the activity to proceed
            }

            if (!this.shouldInterceptActivity(activity)) {
                console.log("Activity doesn't need targeting, allowing to proceed:", activity.name);
                return true; // Allow the activity to proceed normally
            }
            
            // Set flag before starting target picker to prevent recursion
            this.isTargetPickerActivity = true;
            this.startTargetPicker(activity);
            return false; // Cancel the original activity
        }

        /**
         * Determine if an activity should be intercepted for target selection
         */
        private static shouldInterceptActivity(activity: any): boolean {
            // Filter: only intercept attacks OR activities with target count >= 1
            return activity.type === "attack" || 
                   (activity.target?.affects?.count && activity.target.affects.count >= 1);
        }

        /**
         * Start the target picker for the given activity
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
                    let firstConfig = null;
                    let firstMessage = null;
                    let firstUsage = null;
                    let first = true;
                    for (const [tokenId, count] of Object.entries(selection)) {
                        const t = canvas.tokens.get(tokenId);
                        if (!t) continue;
                        for (let i = 0; i < count; i++) {
                            game.user?.targets.forEach(tok => tok.setTarget(false, { releaseOthers: true }));
                            t.setTarget(true, { releaseOthers: true });
                            if (first) {
                                // First use: let dialog appear, store full config
                                const result = await activity.use();
                                if (result && typeof result === "object") {
                                    firstConfig = result;
                                    firstUsage = result.usage ?? {};
                                    firstMessage = result.message ?? {};
                                }
                                first = false;
                            } else {
                                // For subsequent uses, try to use a Forward activity if available
                                let usedForward = false;
                                const item = activity.item;
                                if (item && item.system?.activities) {
                                    // Find a Forward activity on the same item
                                    const forward = Array.from(item.system.activities.values()).find(a => (a as any).type === "forward");
                                    if (forward && typeof (forward as any).use === "function") {
                                        await (forward as any).use();
                                        usedForward = true;
                                    }
                                }
                                if (!usedForward) {
                                    // Fallback: deep clone the config and skip dialog
                                    const nextConfig = foundry.utils.deepClone(firstConfig);
                                    nextConfig.consume = false;
                                    await activity.use(
                                        nextConfig,
                                        { skip: true },
                                        firstMessage || {}
                                    );
                                }
                            }
                        }
                    }
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
         * Get the actor's token for target picking
         */
        private static getActorToken(activity: any): any {
            return activity.actor?.token?.object || canvas.tokens?.controlled?.[0];
        }

        /**
         * Determine the number of targets needed for the activity
         */
        private static getTargetCount(activity: any): number {
            return activity.type === "attack" ? 1 : (activity.target?.affects?.count || 1);
        }

        /**
         * Get the activity's range for target selection
         */
        private static getActivityRange(activity: any): number {
            return activity.range?.value || 30;
        }

        /**
         * Execute the activity after target selection
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
         * Reset the target picker activity flag
         */
        private static resetFlag(): void {
            this.isTargetPickerActivity = false;
        }

        // Legacy methods - kept for compatibility but not used in current flow
        static requiresTargeting(activity: any): boolean {
            console.log(activity);
            this.startTargetPicker(activity);
            return false;
        }

        static async useActivity(activity: any, options: any = {}): Promise<any> {
            return this.executeActivity(activity, options);
        }
    }
}
