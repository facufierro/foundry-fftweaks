fft.getCompendiumItems("fftweaks.spells", { tagsList: ["Druid"] })
    .then(items => fft.chooseItemsDialog(items.filter(item => item.system.level === 0), maxSelections = 2, showIcon = true, showTooltip = true))
    .then(chosenCantrips => fft.addItemsToActor(actor, chosenCantrips))
    .then(() => fft.getCompendiumItems("fftweaks.spells", { tagsList: ["Druid"] }))
    .then(items => fft.chooseItemsDialog(items.filter(item => item.system.level === 1), maxSelections = 1, showIcon = true, showTooltip = true))
    .then(chosenLevel1Spells => fft.addItemsToActor(actor, chosenLevel1Spells));
