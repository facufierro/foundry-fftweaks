className = "Artificer";
character = new FFT.Character(actor);
level = actor.items.find(i => i.type === "class" && i.name === className)?.system?.levels ?? 0;
if (level === 1) {
    await FFT.SpellSelector.renderDialog({ character, list: "Artificer", level: 0, choices: 2 });
    await FFT.SpellSelector.giveAllSpells(character, className, 1);
}
if (level === 5) {
    await FFT.SpellSelector.giveAllSpells(character, className, 2);
}
if (level === 9) {
    await FFT.SpellSelector.giveAllSpells(character, className, 3);
}
if (level === 10) {
    await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 1 });
}
if (level === 13) {
    await FFT.SpellSelector.giveAllSpells(character, className, 4);
}
if (level === 14) {
    await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 1 });
}
if (level === 17) {
    await FFT.SpellSelector.giveAllSpells(character, className, 5);
}