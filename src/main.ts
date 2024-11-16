/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

// Initialize FFT.Functions first
(window as any).FFT = (window as any).FFT || {};
(window as any).FFT.Addons = (window as any).FFT.Addons || {};
(window as any).FFT.Functions = (window as any).FFT.Functions || {};



// Initialize MonksTokenbar after macros are set
Hooks.once("ready", () => {
    FFT.Addons.ActionBar.initialize();
});
