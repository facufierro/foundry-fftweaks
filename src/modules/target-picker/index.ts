// Include the core target picker functionality
/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />

namespace FFT {
    export class TargetPickerModule {
        static initialize() {
            // Hook to cancel item usage
            Hooks.on("dnd5e.preUseItem", (item, config, options) => {
                console.log("Item use intercepted:", item.name);
                // Cancel all item usage
                return false;
            });

            // Hook to cancel activity usage (newer D&D 5e system)
            Hooks.on("dnd5e.preUseActivity", (activity, config, options) => {
                console.log("Activity use intercepted:", activity.name, activity.type);
                console.log("Activity target:", activity.target);
                
                // Check if the activity requires target selection
                const target = activity.target;
                const affectsType = target?.affects?.type;
                const templateType = target?.template?.type;
                
                // Attack activities always require targets (even if not configured in target field)
                const isAttackActivity = activity.type === "attack";
                
                // Area spells with templates use template placement, not token selection
                const isTemplateSpell = templateType && templateType !== "";
                
                const requiresTargeting = isAttackActivity || (affectsType && !isTemplateSpell && (
                    affectsType === "creature" ||
                    affectsType === "enemy" ||
                    affectsType === "ally" ||
                    affectsType === "object" ||
                    affectsType === "creatureOrObject" ||
                    affectsType === "any"
                ));
                
                if (requiresTargeting) {
                    console.log("Intercepting activity that requires targeting:", activity.type, 
                               isAttackActivity ? "(attack activity)" : `affects: ${affectsType}`);
                    // Cancel activities that require target selection
                    return false;
                } else {
                    const reason = isTemplateSpell ? `(template: ${templateType})` : `affects: ${affectsType || "none/self"}`;
                    console.log("Allowing activity that doesn't require targeting:", activity.type, reason);
                    // Allow activities that don't require targeting (self, automatic, template-based, etc.)
                    return true;
                }
            });

            // Hook to cancel activity consumption
            Hooks.on("dnd5e.preActivityConsumption", (activity, usageConfig, messageConfig) => {
                console.log("Activity consumption intercepted:", activity.name, activity.type);
                
                // Use the same targeting logic as the activity hook
                const target = activity.target;
                const affectsType = target?.affects?.type;
                const templateType = target?.template?.type;
                
                // Attack activities always require targets (even if not configured in target field)
                const isAttackActivity = activity.type === "attack";
                
                // Area spells with templates use template placement, not token selection
                const isTemplateSpell = templateType && templateType !== "";
                
                const requiresTargeting = isAttackActivity || (affectsType && !isTemplateSpell && (
                    affectsType === "creature" ||
                    affectsType === "enemy" ||
                    affectsType === "ally" ||
                    affectsType === "object" ||
                    affectsType === "creatureOrObject" ||
                    affectsType === "any"
                ));
                
                if (requiresTargeting) {
                    console.log("Canceling consumption for targeting activity:", activity.type,
                               isAttackActivity ? "(attack activity)" : `affects: ${affectsType}`);
                    // Cancel consumption for activities that require target selection
                    return false;
                } else {
                    const reason = isTemplateSpell ? `(template: ${templateType})` : `affects: ${affectsType || "none/self"}`;
                    console.log("Allowing consumption for non-targeting activity:", activity.type, reason);
                    // Allow consumption for activities that don't require targeting
                    return true;
                }
            });
        }
    }
}
