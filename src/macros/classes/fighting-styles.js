fft.getCompendiumItems("fftweaks.character-creation", { folderId: "fWo0SwVXBtBnnJun" })
    .then(items => fft.chooseItemsDialog(items, maxSelections = 1, showIcon = true, showTooltip = true))
    .then(chosenCantrips => fft.addItemsToActor(actor, chosenCantrips))