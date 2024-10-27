export async function getItemsInCompendiumFolder(folderId) {
    const compendium = game.packs.get("fftweaks.character-creation");
    await compendium.getIndex();
    return compendium.index.contents
        .filter(item => item.folder === folderId)
        .map(item => ({ id: item._id, name: item.name }));
}

export async function removeItemsByName(actor, itemName) {
    const itemsToRemove = actor.items.filter(i => i.name === itemName);
    if (itemsToRemove.length > 0) {
        await actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(item => item.id));
    }
}

export async function addItemsToActor(actor, itemIds) {
    if (!Array.isArray(itemIds)) itemIds = [itemIds];

    const compendium = game.packs.get("fftweaks.character-creation");
    const items = await Promise.all(itemIds.map(id => compendium.getDocument(id)));
    await actor.createEmbeddedDocuments("Item", items.map(item => item.toObject()));
}