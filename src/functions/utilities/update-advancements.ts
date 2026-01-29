/**
 * Update advancement items in a target item or specific advancement.
 * Matches existing items by name and replaces their UUIDs with those from a source compendium.
 * 
 * @param targetUuid - The UUID of the target Item OR specific Advancement
 *        (Item: "Compendium.fftweaks.classes.Item.BB4w1RNuF0r4fQ68")
 *        (Advancement: "Compendium.fftweaks.classes.Item.BB4w1RNuF0r4fQ68.Advancement.mublfIeDeEawCXLL")
 * @param sourceCompendiumId - The source compendium pack ID (e.g., "fftweaks.spells")
 * @param filterFolderIds - Optional array of folder IDs to filter items from source compendium
 */
export async function updateAdvancements(
    targetUuid: string,
    sourceCompendiumId: string,
    filterFolderIds: string[] = []
): Promise<void> {
    const uuidParts = targetUuid.split(".");

    // Validate UUID
    if (uuidParts[0] !== "Compendium" || uuidParts.length < 4) {
        ui.notifications?.error("Invalid target UUID format. Must be a Compendium Item or Advancement UUID.");
        return;
    }

    // Determine if we are targeting a specific advancement or an entire item
    const isSpecificAdvancement = uuidParts.includes("Advancement");
    const advancementId = isSpecificAdvancement ? uuidParts[uuidParts.indexOf("Advancement") + 1] : null;

    // Extract Item UUID
    // If it's an advancement UUID, we want everything before ".Advancement"
    // Otherwise, it's just the Item UUID itself
    const itemUuid = isSpecificAdvancement
        ? uuidParts.slice(0, uuidParts.indexOf("Advancement")).join(".")
        : targetUuid;

    const targetItem = await fromUuid(itemUuid) as any;

    if (!targetItem) {
        ui.notifications?.error(`Target item not found: ${itemUuid}`);
        return;
    }

    // Get the source compendium pack
    const sourcePack = game.packs.get(sourceCompendiumId);
    if (!sourcePack) {
        ui.notifications?.error(`Source compendium not found: ${sourceCompendiumId}`);
        return;
    }

    ui.notifications?.info("Mapping source items by name...");

    // Build a map of name -> UUID from source compendium
    const sourceMap = new Map<string, string>();
    for (const indexEntry of sourcePack.index) {
        const entry = indexEntry as any;
        if (filterFolderIds.length > 0 && !filterFolderIds.includes(entry.folder)) continue;
        if (entry.name) {
            sourceMap.set(entry.name.toLowerCase(), `Compendium.${sourceCompendiumId}.Item.${entry._id}`);
        }
    }

    console.log(`FFTweaks | Source map built with ${sourceMap.size} unique names`);

    // Get the item data to modify the advancement array directly
    const itemData = targetItem.toObject();
    const advancements = itemData.system.advancement || [];

    if (advancements.length === 0) {
        ui.notifications?.warn(`No advancements found in item: ${targetItem.name}`);
        return;
    }

    // Filter which advancements to process
    const toProcess = isSpecificAdvancement
        ? advancements.filter((a: any) => a._id === advancementId)
        : advancements.filter((a: any) => ["ItemGrant", "ItemChoice"].includes(a.type));

    if (toProcess.length === 0) {
        ui.notifications?.warn(isSpecificAdvancement
            ? `Advancement ${advancementId} not found.`
            : `No ItemGrant or ItemChoice advancements found in ${targetItem.name}.`);
        return;
    }

    ui.notifications?.info(`Checking ${toProcess.length} advancements...`);
    let totalUpdateCount = 0;

    for (const adv of toProcess) {
        console.log(`FFTweaks | Checking advancement: ${adv.title || adv.type} (${adv._id})`);

        // Ensure configuration object exists
        if (!adv.configuration) adv.configuration = {};

        // Get the current advancement items/pool
        const isChoice = adv.type === "ItemChoice";
        const currentEntries = (isChoice ? adv.configuration.pool : adv.configuration.items) || [];

        if (currentEntries.length === 0) {
            console.log(`FFTweaks | Skipping empty advancement: ${adv.title || adv._id}`);
            continue;
        }

        let advUpdateCount = 0;

        // Iterate through items and replace UUIDs if name matches
        for (const entry of (currentEntries as any[])) {
            const currentUuid = entry.uuid;
            if (!currentUuid) continue;

            const item = await fromUuid(currentUuid) as any;
            const itemName = item?.name?.toLowerCase();

            if (itemName && sourceMap.has(itemName)) {
                const newUuid = sourceMap.get(itemName)!;
                if (currentUuid !== newUuid) {
                    entry.uuid = newUuid;
                    advUpdateCount++;
                    console.log(`FFTweaks |   Replaced: ${item.name} -> ${newUuid}`);
                }
            }
        }

        if (advUpdateCount > 0) {
            console.log(`FFTweaks |   Updated ${advUpdateCount} items in this advancement.`);
            totalUpdateCount += advUpdateCount;
        }
    }

    if (totalUpdateCount === 0) {
        ui.notifications?.info("No items were updated (no matches found or already using source compendium UUIDs).");
        return;
    }

    try {
        await targetItem.update({
            "system.advancement": advancements
        });

        ui.notifications?.info(`Successfully replaced ${totalUpdateCount} items across ${toProcess.length} advancements`);
        console.log(`FFTweaks | Successfully updated ${totalUpdateCount} items in item ${targetItem.name}`);
    } catch (error) {
        console.error(`FFTweaks | Failed to update advancements:`, error);
        ui.notifications?.error("Failed to update advancements. Check console for details.");
    }
}
