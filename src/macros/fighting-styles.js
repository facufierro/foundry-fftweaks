(async () => {
    const fightingStyles = await fft.getItemsInCompendiumFolder("fWo0SwVXBtBnnJun");
    const chosenItems = await fft.chooseItemsDialog(fightingStyles, 1);
    await fft.removeItemsByName(actor, "Fighting Style");
    await fft.addItemsToActor(actor, chosenItems);
})();
