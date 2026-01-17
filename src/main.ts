// Utils
import { Debug } from "./utils/debug";

// Modules
import { Functions } from "./functions";
import { FunctionBar } from "./modules/function-bar";
import { TargetPicker } from "./modules/target-picker";

const FFT = ((globalThis as any).FFT ??= {});
FFT.Debug = Debug;
FFT.Functions = Functions;

Hooks.once("init", () => {
    Debug.Log("FFTweaks | Initializing Init Hooks");
});

Hooks.once("ready", async () => {
    Debug.Log("FFTweaks | Initializing Ready Hooks");
    await FunctionBar.initialize();
    TargetPicker.initialize();
});
