// Include the core target picker functionality
/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />

namespace FFT {
    export class TargetPickerModule {
        static isTargetPickerActivity: boolean = false;

        static initialize() {

            Hooks.on("dnd5e.preUseActivity", (activity, config, options) => {
                console.log("Activity use intercepted:", activity.name, activity.type);
                if (this.isTargetPickerActivity) {
                    console.log("Target picker is already active, skipping:", activity.name);
                    return true; // Allow the activity to proceed
                }

                // Filter: only intercept attacks OR activities with target count >= 1
                if (activity.type !== "attack" && (!activity.target?.affects?.count || activity.target.affects.count < 1)) {
                    console.log("Activity doesn't need targeting, allowing to proceed:", activity.name);
                    return true; // Allow the activity to proceed normally
                }
                
                // Set flag before starting target picker to prevent recursion
                this.isTargetPickerActivity = true;
                this.startTargetPicker(activity);
                return false; // Cancel the original activity
            });

            // Hooks.on("dnd5e.preActivityConsumption", (activity, usageConfig, messageConfig) => {
            //     console.log("Activity consumption intercepted:", activity.name, activity.type);
            //     return this.requiresTargeting(activity);
            // });
        }


        static async startTargetPicker(activity: any) {
            try {
                // Get the actor token
                const token = activity.actor?.token?.object || canvas.tokens?.controlled?.[0];
                // Simple target picker - determine target count
                const targetCount = activity.type === "attack" ? 1 : (activity.target?.affects?.count || 1);
                const success = await TargetPicker.pickTargets(token, targetCount, {
                    normal: activity.range?.value || 30
                });

                if (success) {
                    console.log("Target picking successful");
                    await this.useActivity(activity);
                } else {
                    console.log("Target picking cancelled");
                    // Reset flag if cancelled
                    this.isTargetPickerActivity = false;
                }
            } catch (error) {
                console.error("Error in target picker:", error);
                // Reset flag on error
                this.isTargetPickerActivity = false;
            }
        }

        static requiresTargeting(activity: any): boolean {
            console.log(activity);
            // Cancel the activity and trigger target picker
            this.startTargetPicker(activity);
            return false; // Cancel the original activity
        }

        static async useActivity(activity: any, options: any = {}) {
            try {
                const result = await activity.use(options.usage || {}, options.dialog || {}, options.message || {});
                console.log("Activity used successfully:", result);
                this.isTargetPickerActivity = false; // Reset the flag
                return result;
            } catch (error) {
                console.error("Failed to use activity:", error);
                throw error;
            }
        }

    }
}
