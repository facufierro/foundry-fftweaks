const actor = game.user.character || game.actors.getName("Alaric Thorgrimson");

fft.getCompendiumItems("fftweaks.spells", { tagsList: ["Wizard"] })
    .then(items => fft.chooseItemsDialog(items.filter(item => item.system.level === 0), maxSelections = 2, showIcon = true))
    .then(chosenCantrips => fft.addItemsToActor(actor, chosenCantrips))
    .then(() => fft.getCompendiumItems("fftweaks.spells", { tagsList: ["Wizard"] }))
    .then(items => fft.chooseItemsDialog(items.filter(item => item.system.level === 1), maxSelections = 1, showIcon = true))
    .then(chosenLevel1Spells => fft.addItemsToActor(actor, chosenLevel1Spells));
