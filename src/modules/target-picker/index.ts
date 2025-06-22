/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />
/// <reference path="./activity-interceptor.ts" />

namespace FFT {
    export class TargetPickerModule {
        /**
         * Initializes the TargetPicker module and hooks into dnd5e activities.
         */
        static initialize(): void {
            Hooks.on("dnd5e.preUseActivity", ActivityInterceptor.onPreUseActivity.bind(ActivityInterceptor));
        }
    }
}
