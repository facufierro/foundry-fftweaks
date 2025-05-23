/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

(window as any).FFT = (window as any).FFT || {};
declare const dnd5e: any;

Hooks.once("ready", () => {
    (window as any).FFT = FFT;
    // Addons
    FFT.ItemMacro.initialize();
    FFT.Levels.initialize();
    // Modules
    FFT.CharacterAnvil.initialize();
    // FFT.ResizeHandler.initialize();
    FFT.FunctionBar.initialize();
});
