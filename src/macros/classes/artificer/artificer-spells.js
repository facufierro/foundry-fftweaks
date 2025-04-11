//OnItemCreate
//OnItemUpdate
className = "Artificer";
character = new FFT.Character(actor);
level = actor.items.find(i => i.type === "class" && i.name === className)?.system?.levels ?? 0;
switch (level) {
    case 1:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 2 });
        await FFT.SpellSelector.addAllSpellsByList(character, className, 1);
        break;
    case 5:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 2);
        break;
    case 9:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 3);
        break;
    case 10:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 1 });
        break;
    case 13:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 4);
        break;
    case 14:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 1 });
        break;
    case 17:
        await FFT.SpellSelector.addAllSpellsByList(character, className, 5);
        break;
    default:
        break;
}
