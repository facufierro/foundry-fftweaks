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
                // Cancel all activity usage
                return false;
            });

            // Hook to cancel activity consumption
            Hooks.on("dnd5e.preActivityConsumption", (activity, usageConfig, messageConfig) => {
                console.log("Activity consumption intercepted:", activity.name, activity.type);
                // Cancel all activity consumption
                return false;
            });
        }
    }
}
