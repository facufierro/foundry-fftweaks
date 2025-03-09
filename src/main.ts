/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

(window as any).FFT = (window as any).FFT || {};
(window as any).FFT.Addons = (window as any).FFT.Addons || {};
(window as any).FFT.Modules = (window as any).FFT.Modules || {};
(window as any).FFT.Functions = (window as any).FFT.Functions || {};

// on ready
Hooks.once("ready", () => {
    FFT.Modules.FunctionBar.initialize();
    FFT.Modules.FolderAutoColor.initialize();
    FFT.Modules.PointBuy.initialize();
    FFT.Modules.StartingEquipment.initialize();
});



