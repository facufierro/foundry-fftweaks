 //RunOnCreate
 character = new FFT.Character(actor);
 await FFT.SpellSelector.renderDialog({ character, choices: 2, list: "Cleric", level: 0 });
 await FFT.SpellSelector.renderDialog({ character, choices: 1, list: "Cleric", level: 1 });