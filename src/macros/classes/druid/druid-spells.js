className = "Druid";
character = new FFT.Character(actor);
level = actor.items.find(i => i.type === "class" && i.name === className)?.system?.levels ?? 0;
switch (level) {
    case 1:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 2 });
        await FFT.SpellSelector.addAllSpellsByList(character, className, 1);
        break;
    case 3:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 2);
        break;
    case 5:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 3);
        break;
    case 7:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 4);
        break;
    case 9:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 5);
        break;
    case 11:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 6);
        break;
    case 13:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 7);
        break;
    case 15:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 8);
        break;
    case 17:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 9);
        break;
}
