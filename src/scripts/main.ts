/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

// Initialize FFT.Macros first
(window as any).FFT = (window as any).FFT || {};
(window as any).FFT.Addons = (window as any).FFT.Addons || {};
(window as any).FFT.Macros = (window as any).FFT.Macros || {};



// Initialize MonksTokenbar after macros are set
Hooks.once("ready", () => {
    FFT.Addons.ActionBar.initialize();
});
