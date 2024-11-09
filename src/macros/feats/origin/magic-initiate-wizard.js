fft.getCompendiumItems("fftweaks.spells", { tagsList: ["Wizard"] })
    .then(items => fft.chooseItemsDialog(items.filter(item => item.system.level === 0)))
    .then(chosenItems => fft.addItemsToActor(actor, chosenItems));
