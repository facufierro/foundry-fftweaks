/**
 * Replace items in a compendium, preserving images and folder structure
 * @param sourcePackId - The source compendium pack ID (e.g., "dnd5e.spells24")
 * @param targetPackId - The target compendium pack ID (e.g., "world.spells-copy")
 * @param excludeItemNames - Optional array of item names to skip
 * @param excludeFolderIds - Optional array of folder IDs to skip
 */
export async function replaceCompendiumItems(
    sourcePackId: string,
    targetPackId: string,
    excludeItemNames: string[] = [],
    excludeFolderIds: string[] = []
): Promise<void> {
    const sourcePack = game.packs.get(sourcePackId);
    const targetPack = game.packs.get(targetPackId);

    if (!sourcePack || !targetPack) {
        ui.notifications?.error("Pack not found");
        return;
    }

    ui.notifications?.info("Starting replacement...");

    // Build image and folder map from target pack
    const imageMap = new Map<string, any>(); // Added 'any' to handle Foundry-specific types
    const folderMap = new Map<string, any>(); // Added 'any' to handle Foundry-specific types

    for (const indexItem of targetPack.index) {
        imageMap.set(indexItem.name, (indexItem as any).img); // Added 'as any' to bypass type error
        folderMap.set(indexItem.name, indexItem.folder);
    }

    const toDelete = [];

    // Load source items and check which to replace
    const sourceIndexItems = Array.from(sourcePack.index);
    const sourceItems = await Promise.all(
        sourceIndexItems.map(indexItem => sourcePack.getDocument(indexItem._id))
    );

    console.log(`Loaded ${sourceItems.length} items from source pack`);

    // Find matching items to delete in target
    for (const indexItem of targetPack.index) {
        if (excludeItemNames.includes(indexItem.name)) continue;
        if (excludeFolderIds.includes(indexItem.folder)) continue;
        if (sourceItems.some(item => item.name === indexItem.name)) {
            toDelete.push(indexItem._id);
        }
    }

    // Delete in batch
    if (toDelete.length > 0) {
        await targetPack.documentClass.deleteDocuments(toDelete, { pack: targetPack.collection });
    }

    // Create items in batch
    const newItems = sourceItems
        .filter(item => !excludeItemNames.includes(item.name))
        .filter(item => !excludeFolderIds.includes(folderMap.get(item.name)))
        .map(item => {
            const data = item.toObject() as any; // Explicitly cast 'data' to 'any'
            if (imageMap.has(item.name)) {
                data.img = imageMap.get(item.name); // Fixed type error by casting
            }
            if (folderMap.has(item.name)) {
                data.folder = folderMap.get(item.name);
            }
            return data;
        });

    await targetPack.documentClass.createDocuments(newItems as any, { pack: targetPack.collection }); // Added 'as any' to bypass type error

    ui.notifications?.info(`Replaced ${toDelete.length} items, added ${sourceItems.length} total`);
}
