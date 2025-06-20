namespace FFT {
    export class TargetPickerModule {
        private static isProcessingTargets = false;

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
            
            console.log("[FFT Target Picker] Hooks registered for dnd5e.preUseItem and dnd5e.preUseActivity");
        }

        /**
         * Handle item usage and trigger target picker if needed
         */
        static async handleItemUsage(item: any, config: any, options: any) {
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

            // Clear existing targets before picking new ones
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            const success = await FFT.TargetPicker.pickTargets(
                token,
                targetInfo.count,
                targetInfo.ranges,
                { showRangeDisplay: true }
            );

            if (!success) {
                ui.notifications.info("Target selection cancelled");
                return false; // Cancel item usage
            }

            // Verify we have the required number of targets
            if (game.user?.targets.size < targetInfo.count) {
                ui.notifications.warn(`Need ${targetInfo.count} targets, only ${game.user?.targets.size} selected`);
                return false;
            }

            return true; // Continue with item usage
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

            // For attack activities, we always want to trigger targeting unless it's explicitly self
            if (activity.type === "attack") {
                console.log("[FFT Target Picker] Attack activity detected, proceeding with targeting");
            } else if (!activity.target?.type || activity.target.type === "self") {
                console.log("[FFT Target Picker] No targeting needed for this activity");
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

            const targetInfo = this.getActivityTargetInfo(activity);
            console.log("[FFT Target Picker] Activity target info:", targetInfo);
            
            if (!targetInfo.needsTargeting) {
                console.log("[FFT Target Picker] Activity target info says no targeting needed");
                return true;
            }

            // Clear existing targets before picking new ones
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            console.log("[FFT Target Picker] Starting target selection...");
            
            // We need to prevent the activity from continuing and handle target selection separately
            setTimeout(async () => {
                this.isProcessingTargets = true;
                
                const success = await FFT.TargetPicker.pickTargets(
                    token,
                    targetInfo.count,
                    targetInfo.ranges,
                    { showRangeDisplay: true }
                );

                if (success && game.user?.targets.size >= targetInfo.count) {
                    console.log("[FFT Target Picker] Target selection successful, restarting activity");
                    // Restart the activity with targets selected
                    await activity.use(config, options);
                } else {
                    console.log("[FFT Target Picker] Target selection failed or cancelled");
                    ui.notifications.info("Target selection cancelled or insufficient targets");
                }
                
                this.isProcessingTargets = false;
            }, 50);

            // Return false to prevent the original activity from continuing
            return false;
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

            // For attack activities, we always need targeting unless explicitly told otherwise
            if (activity.type === "attack") {
                needsTargeting = true;
                count = 1; // Attacks typically target one creature
            } else {
                // For other activities, use the existing logic
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
                        needsTargeting = true;
                        count = 1;
                        break;
                }
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
