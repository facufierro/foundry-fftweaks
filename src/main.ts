/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

(window as any).FFT = (window as any).FFT || {};

Hooks.once("ready", () => {
    (window as any).FFT = FFT;
    FFT.CharacterAnvil.initialize();
    FFT.ItemMacro.initialize();

});
