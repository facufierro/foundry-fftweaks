// Include the core target picker functionality
/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />

namespace FFT {
    export class TargetPickerModule {
        static initialize() {

            // Hook to cancel activity usage (newer D&D 5e system)
            Hooks.on("dnd5e.preUseActivity", async (activity, config, options) => {
                return false; // Prevent default activity usage
                return FFT.TargetPickerModule.handleTargetingActivity(activity, config, options);
            });

            // Hook to cancel activity consumption
            Hooks.on("dnd5e.preActivityConsumption", (activity, usageConfig, messageConfig) => {
                return false; // Prevent default activity consumption
                return FFT.TargetPickerModule.handleTargetingConsumption(activity, usageConfig, messageConfig);
            });
        }

        static async handleTargetingActivity(activity: any, config?: any, options?: any): Promise<boolean> {
            console.log("Activity use intercepted:", activity.name, activity.type);
            console.log("Activity target:", activity.target);

            const target = activity.target;
            const affectsType = target?.affects?.type;
            const templateType = target?.template?.type;
            const isAttackActivity = activity.type === "attack";
            const isTemplateSpell = templateType && templateType !== "";
            const requiresTargeting = FFT.TargetPickerModule.requiresTargeting(activity);

            if (requiresTargeting) {
                console.log("Intercepting activity that requires targeting:", activity.type,
                    isAttackActivity ? "(attack activity)" : `affects: ${affectsType}`);
                const actor = activity.item.actor;
                const token = actor?.getActiveTokens()?.[0];
                if (!token) {
                    ui.notifications.warn("No token found for this actor");
                    return false;
                }
                game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));
                const success = await FFT.TargetPicker.pickTargets(token, 1);
                if (success && game.user?.targets.size > 0) {
                    console.log("Targets selected, proceeding with activity");
                    setTimeout(async () => {
                        try {
                            if (activity.type === "attack") {
                                await activity.rollAttack(config || {});
                            } else if (activity.type === "damage") {
                                await activity.rollDamage(config || {});
                            } else if (activity.type === "save") {
                                await activity.rollDamage(config || {});
                            } else if (activity.type === "heal") {
                                await activity.rollDamage(config || {});
                            } else {
                                if (activity.damage?.parts?.length > 0) {
                                    await activity.rollDamage(config || {});
                                } else {
                                    console.log("No suitable method found for activity type:", activity.type);
                                }
                            }
                        } catch (error) {
                            console.error("Error executing activity:", error);
                        }
                    }, 100);
                    return false;
                } else {
                    console.log("No targets selected, canceling activity");
                    return false;
                }
            } else {
                const reason = isTemplateSpell ? `(template: ${templateType})` : `affects: ${affectsType || "none/self"}`;
                console.log("Allowing activity that doesn't require targeting:", activity.type, reason);
                return true;
            }
        }

        static handleTargetingConsumption(activity: any, usageConfig?: any, messageConfig?: any): boolean {
            console.log("Activity consumption intercepted:", activity.name, activity.type);
            const requiresTargeting = FFT.TargetPickerModule.requiresTargeting(activity);
            const target = activity.target;
            const affectsType = target?.affects?.type;
            const templateType = target?.template?.type;
            if (requiresTargeting) {
                console.log("Canceling consumption for targeting activity:", activity.type,
                    activity.type === "attack" ? "(attack activity)" : `affects: ${affectsType}`);
                return false;
            } else {
                const reason = templateType && templateType !== "" ? `(template: ${templateType})` : `affects: ${affectsType || "none/self"}`;
                console.log("Allowing consumption for non-targeting activity:", activity.type, reason);
                return true;
            }
        }

        static requiresTargeting(activity: any): boolean {
            const target = activity.target;
            const affectsType = target?.affects?.type;
            const templateType = target?.template?.type;

            // Attack activities always require targets (even if not configured in target field)
            const isAttackActivity = activity.type === "attack";

            // Area spells with templates use template placement, not token selection
            const isTemplateSpell = templateType && templateType !== "";

            return isAttackActivity || (affectsType && !isTemplateSpell && (
                affectsType === "creature" ||
                affectsType === "enemy" ||
                affectsType === "ally" ||
                affectsType === "object" ||
                affectsType === "creatureOrObject" ||
                affectsType === "any"
            ));
        }
    }
}
