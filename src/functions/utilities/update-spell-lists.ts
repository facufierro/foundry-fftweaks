/**
 * Replaces the spell list in a target Journal Page (matching the folder name) with Compendium UUIDs of spells found in the specified World Folder.
 * 
 * @param sourceFolderId - The folder ID containing spells (e.g., "Folder.qE8ivHilYnuVFpyk")
 * @param sourceCompendiumId - The source compendium with spell items (e.g., "fftweaks.spells")
 * @param targetJournalPackId - The target journal compendium (e.g., "fftweaks.journals")
 */
export async function updateSpellLists(
    sourceFolderId: string,
    sourceCompendiumId: string,
    targetJournalPackId: string
): Promise<void> {
    const spellPack = game.packs.get(sourceCompendiumId);
    const journalPack = game.packs.get(targetJournalPackId);

    if (!spellPack || !journalPack) {
        ui.notifications?.error("Pack not found");
        return;
    }

    // Get the source folder (handle both "Folder.id" and just "id" formats)
    const folderId = sourceFolderId.replace(/^Folder\./, "");
    const folder = game.folders?.get(folderId);
    if (!folder) {
        ui.notifications?.error(`Folder not found: ${sourceFolderId}`);
        return;
    }

    const folderName = folder.name as string;
    console.log(`Processing folder: ${folderName}`);

    // Build a map of spell names to UUIDs from the source compendium
    const spellNameToUuid = new Map<string, string>();
    for (const indexEntry of spellPack.index) {
        const spellName = (indexEntry.name as string).toLowerCase();
        spellNameToUuid.set(spellName, `Compendium.${sourceCompendiumId}.Item.${indexEntry._id}`);
    }
    console.log(`Built spell map with ${spellNameToUuid.size} spells`);

    // Get all spells from the folder and match them with compendium spells
    const spellUuids: string[] = [];
    const folderContents = (folder as any).contents || [];
    console.log(`Folder contains ${folderContents.length} items`);
    
    for (const item of folderContents) {
        const itemName = item.name?.toLowerCase();
        
        if (itemName && spellNameToUuid.has(itemName)) {
            const uuid = spellNameToUuid.get(itemName)!;
            spellUuids.push(uuid);
            console.log(`  Matched: ${item.name}`);
        } else {
            console.log(`  Not found in compendium: ${item.name}`);
        }
    }

    console.log(`Matched ${spellUuids.length} spells from folder`);

    if (spellUuids.length === 0) {
        ui.notifications?.warn(`No matching spells found in folder: ${folderName}`);
        return;
    }

    // Find the matching journal page
    const journalIndexItems = Array.from(journalPack.index);
    console.log(`Searching ${journalIndexItems.length} journals for matching pages`);

    for (const journalIndex of journalIndexItems) {
        const journal = await journalPack.getDocument(journalIndex._id);
        const pages = (journal as any).pages.contents;

        for (const page of pages) {
            // Check if page name matches folder name (case-insensitive)
            if (page.name?.toLowerCase() === folderName.toLowerCase() && page.type === "spells") {
                console.log(`Found matching page: ${page.name} in journal ${(journal as any).name}`);
                console.log(`Updating page with ${spellUuids.length} spells`);

                // Update the page
                await page.update({ "system.spells": spellUuids });

                ui.notifications?.info(`Updated ${page.name} spell list with ${spellUuids.length} spells`);
                return;
            }
        }
    }

    ui.notifications?.warn(`No matching journal page found for: ${folderName}`);
}
