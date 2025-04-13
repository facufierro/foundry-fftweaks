//RunOnCreate
//RunOnUpdate
className = "Warlock";
character = new FFT.Character(actor);
level = actor.items.find(i => i.type === "class" && i.name === className)?.system?.levels ?? 0;
switch (level) {
    case 1:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 2 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 1, choices: 2 });
        break;
    case 2:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 1, choices: 1 });
        break;
    case 3:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2], choices: 1 });
        break;
    case 4:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 1 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2], choices: 1 });
        break;
    case 5:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3], choices: 1 });
        break;
    case 6:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3], choices: 1 });
        break;
    case 7:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4], choices: 1 });
        break;
    case 8:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4], choices: 1 });
        break;
    case 9:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4, 5], choices: 1 });
        break;
    case 10:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 1 });
        break;
    case 11:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4, 5], choices: 1 });
        break;
    case 12:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        break;
    case 13:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4, 5], choices: 1 });
        break;
    case 14:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        break;
    case 15:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4, 5], choices: 1 });
        break;
    case 16:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        break;
    case 17:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4, 5], choices: 1 });
        break;
    case 18:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        break;
    case 19:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        await FFT.SpellSelector.renderDialog({ character, list: className, level: [1, 2, 3, 4, 5], choices: 1 });
        break;
    case 20:
        await FFT.SpellSelector.renderDialog({ character, list: className, level: 0, choices: 0 });
        break;
    default:
        ui.notifications.warn(`No spell selector defined for ${className} at level ${level}`);
        break;

}
