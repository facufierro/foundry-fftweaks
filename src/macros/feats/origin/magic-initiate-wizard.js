//RunOnCreate
character = new FFT.Character(actor);
await FFT.SpellSelector.renderDialog({ character, list: "Wizard", level: 0, choices: 2 });
await FFT.SpellSelector.renderDialog({ character, list: "Wizard", level: 1, choices: 1 });
