// Utils
import { Debug } from "./utils/debug";

// Plugins
import { Functions } from "./functions";
import { FunctionBar } from "./plugins/function-bar";
import { TargetPicker } from "./plugins/target-picker";
import { DNDCustomizer as DNDCustomizer } from "./plugins/dnd-customizer";
import { AdvancementSync } from "./plugins/advancement-sync";

const FFT = ((globalThis as any).FFT ??= {});
FFT.Debug = Debug;
FFT.Functions = Functions;

Hooks.once("init", () => {
    Debug.Log("FFTweaks | Initializing Init Hooks");
    DNDCustomizer.initialize();
});

Hooks.once("ready", async () => {
    Debug.Log("FFTweaks | Initializing Ready Hooks");
    await FunctionBar.initialize();
    TargetPicker.initialize();
    AdvancementSync.initialize();
});
