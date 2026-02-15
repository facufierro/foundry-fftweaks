// Utils
import { Debug } from "./utils/debug";

// Plugins
import { Functions } from "./functions";
import { FunctionBar } from "./plugins/function-bar";
import { TargetPicker } from "./plugins/target-picker";
import { DNDCustomizer as DNDCustomizer } from "./plugins/dnd-customizer";
import { AdvancementSync } from "./plugins/advancement-sync";
import { ContainerAdvancement } from "./plugins/container-advancement";

import { Automations } from "./automations";
import { TokenVisuals } from "./plugins/token-visuals";

const FFT = ((globalThis as any).FFT ??= {});
FFT.Debug = Debug;
FFT.Functions = Functions;

Hooks.once("init", () => {
    Debug.Log("FFTweaks | Initializing Init Hooks");
    DNDCustomizer.initialize();
});

Hooks.once("ready", async () => {
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
    TokenVisuals.initialize();
});
