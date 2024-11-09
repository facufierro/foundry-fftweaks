const actor = game.user.character || game.actors.getName("Alaric Thorgrimson");

fft.getCompendiumItems("fftweaks.spells", { tagsList: ["Wizard"] })
    .then(items => fft.chooseItemsDialog(items.filter(item => item.system.level === 0), 2)) // Pass 2 as maxSelections
    .then(chosenItems => fft.addItemsToActor(actor, chosenItems));
