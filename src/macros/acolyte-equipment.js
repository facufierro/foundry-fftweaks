(async () => {
    const actor = game.user.character;
    const items = await fft.getItemsInCompendiumFolder("fWo0SwVXBtBnnJun");
    const chosenItems = await fft.chooseItemsDialog(items, 1);
    await fft.removeItemsByName(actor, "Acolyte Equipment");
    await fft.addItemsToActor(actor, chosenItems);
})();
