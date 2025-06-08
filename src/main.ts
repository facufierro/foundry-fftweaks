/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

(window as any).FFT = (window as any).FFT || {};
declare const dnd5e: any;

Hooks.once("ready", () => {
    (window as any).FFT = FFT;
    // Addons
    FFT.ItemMacroAddon.initialize();
    FFT.LevelsAddon.initialize();
    // FFT.SimpleCalendarAddon.initialize();
    // Modules
    FFT.FunctionBarModule.initialize();
    FFT.CharacterAnvilModule.initialize();
    // FFT.ResizeHandler.initialize();
    FFT.TokenVisualsModule.initialize();
});
