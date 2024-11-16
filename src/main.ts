/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

(window as any).FFT = (window as any).FFT || {};
(window as any).FFT.Addons = (window as any).FFT.Addons || {};
(window as any).FFT.Functions = (window as any).FFT.Functions || {};

Hooks.once("ready", () => {
    FFT.Addons.FunctionBar.initialize();
});
