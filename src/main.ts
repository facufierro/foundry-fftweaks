import { FunctionBar } from "./modules/function-bar/function-bar";
import { Debug } from "./utils/debug";

Hooks.once("init", () => {
    Debug.Log("FFTweaks | Initializing FFTweaks Module");
});

Hooks.once("ready", async () => {
    Debug.Log("FFTweaks | FFTweaks is active");
    await FunctionBar.initialize();
});
