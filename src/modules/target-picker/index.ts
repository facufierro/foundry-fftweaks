/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />
/// <reference path="./activity-interceptor.ts" />

namespace FFT {
    export class TargetPickerModule {
        static initialize(): void {
            Hooks.on("dnd5e.preUseActivity", ActivityInterceptor.onPreUseActivity.bind(ActivityInterceptor));
        }
    }
}
