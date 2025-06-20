// Include the core target picker functionality
/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />

namespace FFT {
    export class TargetPickerModule {
        static lastActivity: any = null;

        static initialize() {

            Hooks.on("dnd5e.preUseActivity", (activity, config, options) => {
                console.log("Activity use intercepted:", activity.name, activity.type);
                this.lastActivity = activity;
                return this.requiresTargeting(activity);

            });

            Hooks.on("dnd5e.preActivityConsumption", (activity, usageConfig, messageConfig) => {
                console.log("Activity consumption intercepted:", activity.name, activity.type);
                return this.requiresTargeting(activity);
            });
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
                return result;
            } catch (error) {
                console.error("Failed to use activity:", error);
                throw error;
            }
        }

        static async startTargetPicker(activity: any) {
            try {
                // Use the stored last activity
                const activityToUse = this.lastActivity;
                if (!activityToUse) {
                    console.warn("No stored activity found");
                    return;
                }

                // Get the actor token
                const token = activityToUse.actor?.token?.object || canvas.tokens?.controlled?.[0];
                if (!token) {
                    console.warn("No token found for targeting");
                    return;
                }

                // Simple target picker - pick 1 target for now
                const success = await TargetPicker.pickTargets(token, 1, {
                    normal: activityToUse.range?.value || 30
                });

                if (success) {
                    console.log("Targets picked, using stored activity...");
                    await this.useActivity(activityToUse);
                } else {
                    console.log("Target picking cancelled");
                }
            } catch (error) {
                console.error("Error in target picker:", error);
            }
        }
    }
}
