/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

(window as any).FFT = (window as any).FFT || {};
declare const dnd5e: any;

Hooks.once("ready", () => {
    (window as any).FFT = FFT;
    FFT.CharacterAnvil.initialize();
    FFT.ItemMacro.initialize();
    FFT.ResizeHandler.initialize();
    FFT.FunctionBar.initialize();
});
