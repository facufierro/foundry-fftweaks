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
                    let firstCastSucceeded = false;
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
                            try {
                                const result = await activity.use();
                                console.debug(`[FFT] Result of activity.use() for target`, t.name, t.id, ':', result);
                                
                                // Check if the activity was successful
                                // Different activity types have different success indicators
                                if (this.isActivitySuccessful(result, activity)) {
                                    firstCastSucceeded = true;
                                    console.debug(`[FFT] First cast succeeded, continuing with remaining targets`);
                                } else {
                                    console.log(`[FFT] First cast failed, stopping multi-target casting`);
                                    break; // Stop the loop if first cast failed
                                }
                            } catch (error) {
                                console.error(`[FFT] First cast failed with error:`, error);
                                break; // Stop the loop on error
                            }
                        } else {
                            // Only continue with subsequent targets if first cast succeeded
                            if (!firstCastSucceeded) {
                                console.debug(`[FFT] Skipping target ${t.name} because first cast failed`);
                                break;
                            }
                            
                            // Subsequent uses: try forward activity first
                            let usedForward = false;
                            const item = activity.item;
                            if (item && item.system?.activities) {
                                const forward = Array.from(item.system.activities.values()).find(
                                    (a: any) => (a as any).type === "forward"
                                );
                                if (forward && typeof (forward as any).use === "function") {
                                    console.debug(`[FFT] Using forward activity for target:`, t.name, t.id);
                                    try {
                                        await (forward as any).use();
                                        usedForward = true;
                                    } catch (error) {
                                        console.error(`[FFT] Forward activity failed for target ${t.name}:`, error);
                                        // Continue to next target even if this one fails
                                    }
                                }
                            }
                            if (!usedForward) {
                                console.debug(`[FFT] No forward activity, using main activity again for target:`, t.name, t.id);
                                try {
                                    await activity.use();
                                } catch (error) {
                                    console.error(`[FFT] Main activity failed for target ${t.name}:`, error);
                                    // Continue to next target even if this one fails
                                }
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
         * Checks if an activity use was successful based on the result
         */
        private static isActivitySuccessful(result: any, activity: any): boolean {
            // If result is null/undefined, assume failure
            if (!result) {
                console.debug(`[FFT] Activity result is null/undefined, treating as failure`);
                return false;
            }

            // For spells, check if spell slot was consumed or if it was cancelled
            if (activity.type === "spell" || activity.item?.type === "spell") {
                // If the result has a message property, it likely succeeded
                if (result.message || result.messages) {
                    console.debug(`[FFT] Spell activity has message, treating as success`);
                    return true;
                }
                
                // Check if spell slots were consumed (indicates successful casting)
                if (result.actorUpdates || result.itemUpdates) {
                    console.debug(`[FFT] Spell activity has updates, treating as success`);
                    return true;
                }
                
                // If result is just an empty object or false, it was likely cancelled
                if (result === false || (typeof result === 'object' && Object.keys(result).length === 0)) {
                    console.debug(`[FFT] Spell activity returned false or empty object, treating as failure`);
                    return false;
                }
            }

            // For attacks, check if there was a roll result
            if (activity.type === "attack") {
                if (result.rolls || result.roll || result.message) {
                    console.debug(`[FFT] Attack activity has roll result, treating as success`);
                    return true;
                }
            }

            // For other activities, if we got any result object, assume success
            if (typeof result === 'object' && result !== null) {
                console.debug(`[FFT] Activity returned an object, treating as success`);
                return true;
            }

            // Default to failure if we can't determine success
            console.debug(`[FFT] Could not determine activity success, treating as failure. Result:`, result);
            return false;
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
