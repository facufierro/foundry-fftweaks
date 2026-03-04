// Utils
import { Debug } from "./utils/debug";
import { ConsoleCapture } from "./utils/console-utility";

// Initialize console capture immediately (before hooks) so all output is logged
ConsoleCapture.initialize();

// Plugins
import { Functions } from "./functions";
import { FunctionBar } from "./plugins/function-bar";
import { TargetPicker } from "./plugins/target-picker";
import { DNDCustomizer as DNDCustomizer } from "./plugins/dnd-customizer";
import { AdvancementSync } from "./plugins/advancement-sync";
import { ContainerAdvancement } from "./plugins/container-advancement";
import { PointBuy } from "./plugins/point-buy";

import { Automations } from "./automations";
import { Equipment } from "./plugins/equipment";
import { TokenVisuals } from "./plugins/token-visuals";
import { AINarrator } from "./plugins/ai-narrator";

const FFT = ((globalThis as any).FFT ??= {});
FFT.Debug = Debug;
FFT.Functions = Functions;

Hooks.once("init" as any, () => {
    Debug.Log("FFTweaks | Initializing Init Hooks");
    DNDCustomizer.initialize();
});

Hooks.once("ready" as any, async () => {
    console.log("FFTweaks | READY HOOK FIRED");
    Debug.Log("FFTweaks | Initializing Ready Hooks");
    await FunctionBar.initialize();
    TargetPicker.initialize();
    AdvancementSync.initialize();
    console.log("FFTweaks | Initializing ContainerAdvancement...", ContainerAdvancement);
    if (ContainerAdvancement && typeof ContainerAdvancement.initialize === 'function') {
        ContainerAdvancement.initialize();
    } else {
        console.error("FFTweaks | ContainerAdvancement.initialize is not a function!", ContainerAdvancement);
    }

    Automations.initialize();
    console.log("FFTweaks | Automations initialized");
    Equipment.initialize();
    console.log("FFTweaks | Equipment initialized");
    TokenVisuals.initialize();
    console.log("FFTweaks | TokenVisuals initialized");
    try {
        PointBuy.initialize();
        console.log("FFTweaks | PointBuy initialized successfully");
    } catch (e) {
        console.error("FFTweaks | PointBuy initialization failed", e);
    }
    
    AINarrator.initialize();

});
