/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />
/// <reference types="@league-of-foundry-developers/foundry-vtt-dnd5e-types" />

// Creature Generator imports
/// <reference path="modules/creature-generator/types.ts" />
/// <reference path="modules/creature-generator/components/cr-calculator.ts" />
/// <reference path="modules/creature-generator/components/stats-generator.ts" />
/// <reference path="modules/creature-generator/components/equipment-generator.ts" />
/// <reference path="modules/creature-generator/components/features-generator.ts" />
/// <reference path="modules/creature-generator/components/spells-generator.ts" />
/// <reference path="modules/creature-generator/components/creature-generator.ts" />
/// <reference path="modules/creature-generator/index.ts" />

(window as any).FFT = (window as any).FFT || {};
declare const dnd5e: any;

Hooks.once("ready", () => {
    (window as any).FFT = FFT;
    // Addons
    FFT.ItemMacroAddon.initialize();
    FFT.LevelsAddon.initialize();
    // FFT.SimpleCalendarAddon.initialize();
    // FFT.SimpleTimekeepingAddon.initialize();
    // Modules
    FFT.FunctionBarModule.initialize();
    FFT.CharacterAnvilModule.initialize();
    // FFT.ResizeHandler.initialize();
    FFT.TokenVisualsModule.initialize();
    FFT.CreatureGeneratorModule.initialize();
});
