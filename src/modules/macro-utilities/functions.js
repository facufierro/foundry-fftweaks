/**
 * Retrieves items from a compendium by folder, specific tags, or a single item ID.
 * @param {string} compendiumId - The ID of the compendium to search.
 * @param {Object} [options] - Optional filters.
 * @param {string} [options.folderId] - Folder ID to filter items within the compendium.
 * @param {Array<string>} [options.tagsList] - Tags to match in item sources.
 * @param {string} [options.fullId] - Full ID of a single item in "Compendium.module.pack.Item.itemId" format.
 * @returns {Promise<Array|Object|null>} - A promise resolving to an array of items, a single item, or null.
 */
export async function getCompendiumItems(compendiumId, options = {}) {
    try {
        const { folderId, tagsList, fullId } = options;
        const compendium = game.packs.get(compendiumId);
        if (!compendium) throw new Error("Compendium not found.");
        await compendium.getIndex();

        // Fetch a specific item if fullId is provided
        if (fullId) {
            const parts = fullId.split('.');
            const itemId = parts[4];
            return await compendium.getDocument(itemId) || null;
        }

        // Filter by folder ID or tags if provided
        const items = await Promise.all(
            compendium.index.contents.map(async entry => {
                const item = await compendium.getDocument(entry._id);

                // Properly handle folder ID comparison
                if (folderId && item.folder?.id !== folderId) return null;

                // Optional tag filtering logic
                if (tagsList) {
                    const itemTags = await getSourceTags(item);
                    if (!Array.isArray(itemTags) || !itemTags.some(tag => tagsList.includes(tag))) return null;
                }
                return item;
            })
        );

        return items.filter(item => item !== null);
    } catch (error) {
        console.error("Error fetching items from compendium:", error);
        return [];
    }
}


/**
 * Extracts custom source tags from an item.
 * @param {Object} item - The item object.
 * @returns {Array<string>|null} - An array of tags if present, or null if no tags are found.
 */
export async function getSourceTags(item) {
    try {
        const tags = item.system?.source?.custom?.split(" ").filter(tag => tag);
        return tags.length ? tags : null;
    } catch (error) {
        console.error(`Error getting custom sources for ${item.name}:`, error);
        return null;
    }
}

/**
 * Adds items to an actor.
 * @param {Object} actor - The actor object to add items to.
 * @param {Array<Object>} items - Array of item objects to add.
 */
export async function addItemsToActor(actor, items) {
    try {
        if (!actor) throw new Error("No valid actor provided.");
        if (!Array.isArray(items)) items = [items];

        await actor.createEmbeddedDocuments("Item", items.map(item => item.toObject()));
    } catch (error) {
        console.error("Error adding items to actor:", error);
    }
}

/**
 * Removes specified items from an actor.
 * @param {Object} actor - The actor object from which to remove items.
 * @param {Array<Object>} items - Array of item objects to remove.
 */
export async function removeItemsFromActor(actor, items) {
    try {
        if (!Array.isArray(items)) items = [items];
        const itemIds = items.map(item => item.id);
        await actor.deleteEmbeddedDocuments("Item", itemIds);
    } catch (error) {
        console.error("Error removing items from actor:", error);
    }
}

