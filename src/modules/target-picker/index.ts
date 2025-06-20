namespace FFT {
    export class TargetPickerModule {
        private static isProcessingTargets = false;
        private static isRestartingActivity = false;

        static initialize() {
            // Register module setting for tutorial guide
            (game.settings as any).register("fftweaks", "targetPickerGuideShown", {
                name: "Target Picker Guide Shown",
                hint: "Whether the target picker tutorial has been shown to the user",
                scope: "client",
                config: false,
                type: Boolean,
                default: false
            });

            console.log("[FFT Target Picker] Initializing hooks...");

            // Hook into item usage to automatically trigger target picker for items that need targets
            Hooks.on("dnd5e.preUseItem", this.handleItemUsage.bind(this));
            Hooks.on("dnd5e.preUseActivity", this.handleActivityUsage.bind(this));
            
            // Additional hooks to ensure we can properly cancel activities
            Hooks.on("dnd5e.preRollAttack", this.handlePreRollAttack.bind(this));
            Hooks.on("dnd5e.preRollDamage", this.handlePreRollDamage.bind(this));
            Hooks.on("dnd5e.activityConsumption", this.handleActivityConsumption.bind(this));
            
            console.log("[FFT Target Picker] Hooks registered for dnd5e activity interception");
        }

        /**
         * Handle item usage and trigger target picker if needed
         */
        static async handleItemUsage(item: any, config: any, options: any) {
            // Prevent infinite loops when we restart the item
            if (this.isProcessingTargets) {
                console.log("[FFT Target Picker] Already processing targets, allowing item to continue");
                return true;
            }

            console.log("[FFT Target Picker] Item usage detected:", {
                itemName: item.name,
                itemType: item.type,
                target: item.system?.target,
                range: item.system?.range,
                config,
                options
            });

            // Only proceed if this item has targeting requirements
            if (!item.system?.target?.type || item.system.target.type === "self") {
                console.log("[FFT Target Picker] No targeting needed for this item");
                return true; // Continue with normal usage
            }

            const actor = item.actor;
            const token = actor?.getActiveTokens()?.[0];
            
            console.log("[FFT Target Picker] Actor and token:", {
                actor: actor?.name,
                token: token?.name,
                hasToken: !!token
            });
            
            if (!token) {
                ui.notifications.warn("No token found for this actor");
                return false; // Cancel usage
            }

            const targetInfo = this.getTargetInfo(item);
            console.log("[FFT Target Picker] Target info:", targetInfo);
            
            if (!targetInfo.needsTargeting) {
                console.log("[FFT Target Picker] Target info says no targeting needed");
                return true; // Continue with normal usage
            }

            // Immediately set processing flag to block all related hooks
            this.isProcessingTargets = true;
            console.log("[FFT Target Picker] Set processing flag, blocking item");

            // Clear existing targets before picking new ones
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            console.log("[FFT Target Picker] Starting target selection for item...");
            
            // Defer target selection to next tick to ensure the item is fully blocked
            setTimeout(async () => {
                const success = await FFT.TargetPicker.pickTargets(
                    token,
                    targetInfo.count,
                    targetInfo.ranges,
                    { showRangeDisplay: true }
                );

                if (success && game.user?.targets.size >= targetInfo.count) {
                    console.log("[FFT Target Picker] Target selection successful, restarting item");
                    // Set restart flag to allow the item to proceed normally
                    this.isRestartingActivity = true;
                    
                    // Restart the item with targets selected
                    try {
                        await item.use(config, options);
                    } catch (error) {
                        console.error("[FFT Target Picker] Error restarting item:", error);
                        ui.notifications.error("Failed to restart item after target selection");
                    }
                    
                    this.isRestartingActivity = false;
                } else {
                    console.log("[FFT Target Picker] Target selection failed or cancelled");
                    ui.notifications.info("Target selection cancelled or insufficient targets");
                }
                
                this.isProcessingTargets = false;
                console.log("[FFT Target Picker] Cleared processing flag");
            }, 10);

            // Always return false to prevent the original item from continuing
            return false;
        }

        /**
         * Handle activity usage (for newer D&D 5e system versions)
         */
        static async handleActivityUsage(activity: any, config: any, options: any) {
            // Prevent infinite loops when we restart the activity
            if (this.isProcessingTargets) {
                console.log("[FFT Target Picker] Already processing targets, allowing activity to continue");
                return true;
            }

            console.log("[FFT Target Picker] Activity usage detected:", {
                activityName: activity.name,
                activityType: activity.type,
                target: activity.target,
                range: activity.range,
                item: activity.item?.name,
                config,
                options
            });

            // Check if this activity needs targeting
            const targetInfo = this.getActivityTargetInfo(activity);
            console.log("[FFT Target Picker] Activity target info:", targetInfo);
            
            if (!targetInfo.needsTargeting) {
                console.log("[FFT Target Picker] Activity target info says no targeting needed");
                return true;
            }

            const item = activity.item;
            const actor = item.actor;
            const token = actor?.getActiveTokens()?.[0];
            
            console.log("[FFT Target Picker] Activity actor and token:", {
                actor: actor?.name,
                token: token?.name,
                hasToken: !!token
            });
            
            if (!token) {
                ui.notifications.warn("No token found for this actor");
                return false;
            }

            // Immediately set processing flag to block all related hooks
            this.isProcessingTargets = true;
            console.log("[FFT Target Picker] Set processing flag, blocking activity");

            // Clear existing targets before picking new ones
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            console.log("[FFT Target Picker] Starting target selection...");
            
            // Defer target selection to next tick to ensure the activity is fully blocked
            setTimeout(async () => {
                const success = await FFT.TargetPicker.pickTargets(
                    token,
                    targetInfo.count,
                    targetInfo.ranges,
                    { showRangeDisplay: true }
                );

                if (success && game.user?.targets.size >= targetInfo.count) {
                    console.log("[FFT Target Picker] Target selection successful, restarting activity");
                    // Set restart flag to allow the activity to proceed normally
                    this.isRestartingActivity = true;
                    
                    // Restart the activity with targets selected
                    try {
                        await activity.use(config, options);
                    } catch (error) {
                        console.error("[FFT Target Picker] Error restarting activity:", error);
                        ui.notifications.error("Failed to restart activity after target selection");
                    }
                    
                    this.isRestartingActivity = false;
                } else {
                    console.log("[FFT Target Picker] Target selection failed or cancelled");
                    ui.notifications.info("Target selection cancelled or insufficient targets");
                }
                
                this.isProcessingTargets = false;
                console.log("[FFT Target Picker] Cleared processing flag");
            }, 10);

            // Always return false to prevent the original activity from continuing
            return false;
        }

        /**
         * Handle pre-roll attack to prevent attacks while targeting
         */
        static handlePreRollAttack(item: any, config: any) {
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking attack roll during target selection");
                return false;
            }
            return true;
        }

        /**
         * Handle pre-roll damage to prevent damage while targeting
         */
        static handlePreRollDamage(item: any, config: any) {
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking damage roll during target selection");
                return false;
            }
            return true;
        }

        /**
         * Handle activity consumption to prevent resource consumption while targeting
         */
        static handleActivityConsumption(activity: any, usage: any) {
            // Only block if we're in the initial target selection phase
            // Don't block when we're restarting the activity after target selection
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking activity consumption during target selection");
                return false;
            }
            return true;
        }

        /**
         * Extract targeting information from an item
         */
        static getTargetInfo(item: any) {
            const target = item.system?.target || {};
            const range = item.system?.range || {};
            
            console.log("[FFT Target Picker] Analyzing item target data:", {
                targetType: target.type,
                targetValue: target.value,
                rangeValue: range.value,
                rangeLong: range.long,
                fullTarget: target,
                fullRange: range
            });
            
            let needsTargeting = false;
            let count = 1;
            let ranges: any = {};

            // Determine if we need manual targeting
            switch (target.type) {
                case "creature":
                case "enemy":
                case "ally":
                    needsTargeting = true;
                    count = target.value || 1;
                    break;
                case "radius":
                case "sphere":
                case "cylinder":
                case "cone":
                case "line":
                case "cube":
                    // Area effects typically need a point target
                    needsTargeting = true;
                    count = 1;
                    break;
            }

            // Add range information if available
            if (range.value && range.value > 0) {
                ranges.normal = range.value;
                if (range.long && range.long > range.value) {
                    ranges.long = range.long;
                }
            }

            const result = { needsTargeting, count, ranges };
            console.log("[FFT Target Picker] Item target analysis result:", result);
            return result;
        }

        /**
         * Extract targeting information from an activity
         */
        static getActivityTargetInfo(activity: any) {
            const target = activity.target || {};
            const range = activity.range || {};
            
            console.log("[FFT Target Picker] Analyzing activity target data:", {
                activityType: activity.type,
                targetType: target.type,
                targetCount: target.count,
                rangeValue: range.value,
                rangeLong: range.long,
                fullTarget: target,
                fullRange: range
            });
            
            let needsTargeting = false;
            let count = 1;
            let ranges: any = {};

            // Check various activity types that need targeting
            switch (activity.type) {
                case "attack":
                    // All attacks need targeting unless explicitly self
                    needsTargeting = target.type !== "self";
                    count = 1;
                    break;
                    
                case "damage":
                    // Damage activities typically need targeting
                    needsTargeting = target.type !== "self";
                    count = target.count || 1;
                    break;
                    
                case "heal":
                    // Healing can target self or others
                    needsTargeting = target.type !== "self";
                    count = target.count || 1;
                    break;
                    
                case "utility":
                case "save":
                case "check":
                    // Check target type for utility activities
                    needsTargeting = target.type && target.type !== "self";
                    count = target.count || 1;
                    break;
                    
                default:
                    // For unknown activity types, check target type
                    switch (target.type) {
                        case "creature":
                        case "enemy":
                        case "ally":
                            needsTargeting = true;
                            count = target.count || 1;
                            break;
                        case "radius":
                        case "sphere":
                        case "cylinder":
                        case "cone":
                        case "line":
                        case "cube":
                            // Area effects typically need a point target
                            needsTargeting = true;
                            count = 1;
                            break;
                        case "self":
                            needsTargeting = false;
                            break;
                        default:
                            // If no specific target type but has a range, likely needs targeting
                            if (range.value && range.value > 0) {
                                needsTargeting = true;
                                count = 1;
                            }
                            break;
                    }
                    break;
            }

            // Add range information if available
            if (range.value && range.value > 0) {
                ranges.normal = range.value;
                if (range.long && range.long > range.value) {
                    ranges.long = range.long;
                }
            }

            const result = { needsTargeting, count, ranges };
            console.log("[FFT Target Picker] Activity target analysis result:", result);
            return result;
        }
    }
}
