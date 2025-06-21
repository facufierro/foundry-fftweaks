// Include the core target picker functionality
/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />
/// <reference path="./activity-interceptor.ts" />

namespace FFT {
    export class TargetPickerModule {
        /**
         * Initialize the Target Picker module
         */
        static initialize(): void {
            Hooks.on("dnd5e.preUseActivity", ActivityInterceptor.onPreUseActivity.bind(ActivityInterceptor));
        }
    }
}
