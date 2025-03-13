/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

(window as any).FFT = (window as any).FFT || {};

// on ready
Hooks.once("ready", () => {
    FFT.CharacterAnvil.initialize();
});
