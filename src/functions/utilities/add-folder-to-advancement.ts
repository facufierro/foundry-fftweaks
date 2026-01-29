/**
 * ============================================================================
 * ADD FOLDER ITEMS TO ADVANCEMENT
 * ============================================================================
 * 
 * Adds all items from a world folder to an advancement's item pool.
 * 
 * USAGE:
 * FFT.Functions.addFolderToAdvancement(
 *     "Folder.oEmq66bWuOGrfPen",
 *     "Compendium.fftweaks.classes.Item.BB4w1RNuF0r4fQ68.Advancement.gyPnueTha9I6mSA0"
 * );
 * 
 * @param folderUuid - UUID of the source folder (e.g., "Folder.oEmq66bWuOGrfPen")
 * @param advancementUuid - UUID of the target advancement
 */

import { Debug } from "../../utils/debug";

export async function addFolderToAdvancement(
    folderUuid: string,
    advancementUuid: string
): Promise<void> {
    // -------------------------------------------------------------------------
    // STEP 1: Parse the advancement UUID to get item and advancement IDs
    // -------------------------------------------------------------------------
    const uuidParts = advancementUuid.split(".");

    if (!uuidParts.includes("Advancement")) {
        ui.notifications?.error("Invalid advancement UUID. Must include .Advancement.xxx");
        return;
    }

    const advancementId = uuidParts[uuidParts.indexOf("Advancement") + 1];
    const itemUuid = uuidParts.slice(0, uuidParts.indexOf("Advancement")).join(".");

    // -------------------------------------------------------------------------
    // STEP 2: Load the target item
    // -------------------------------------------------------------------------
    const targetItem = await fromUuid(itemUuid) as any;
    if (!targetItem) {
        ui.notifications?.error(`Target item not found: ${itemUuid}`);
        return;
    }

    // -------------------------------------------------------------------------
    // STEP 3: Find the advancement within the item
    // -------------------------------------------------------------------------
    const itemData = targetItem.toObject();
    const advancements = itemData.system.advancement || [];
    const targetAdv = advancements.find((a: any) => a._id === advancementId);

    if (!targetAdv) {
        ui.notifications?.error(`Advancement not found: ${advancementId}`);
        return;
    }

    if (!["ItemGrant", "ItemChoice"].includes(targetAdv.type)) {
        ui.notifications?.error(`Advancement type ${targetAdv.type} does not support items.`);
        return;
    }

    // -------------------------------------------------------------------------
    // STEP 4: Get items from the world folder
    // -------------------------------------------------------------------------
    const folderId = folderUuid.replace("Folder.", "");

    // Get items from world Items collection that are in this folder
    const folderItems: { uuid: string; name: string }[] = [];
    for (const item of game.items as any) {
        if (item.folder?.id === folderId) {
            folderItems.push({
                uuid: item.uuid,
                name: item.name
            });
        }
    }

    if (folderItems.length === 0) {
        ui.notifications?.warn(`No items found in folder ${folderId}`);
        return;
    }

    Debug.Log(`Found ${folderItems.length} items in folder`);

    // -------------------------------------------------------------------------
    // STEP 5: Add items to the advancement
    // -------------------------------------------------------------------------
    const isChoice = targetAdv.type === "ItemChoice";
    if (!targetAdv.configuration) targetAdv.configuration = {};

    // Get existing entries
    const existingEntries = (isChoice ? targetAdv.configuration.pool : targetAdv.configuration.items) || [];
    const existingUuids = new Set(existingEntries.map((e: any) => e.uuid));

    // Add new items (skip duplicates)
    let addedCount = 0;
    for (const item of folderItems) {
        if (!existingUuids.has(item.uuid)) {
            const entry = isChoice ? { uuid: item.uuid } : { uuid: item.uuid, optional: false };
            existingEntries.push(entry);
            addedCount++;
            Debug.Log(`Added: ${item.name}`);
        }
    }

    if (addedCount === 0) {
        ui.notifications?.info("All items already exist in the advancement.");
        return;
    }

    // Update the advancement
    if (isChoice) {
        targetAdv.configuration.pool = existingEntries;
    } else {
        targetAdv.configuration.items = existingEntries;
    }

    // -------------------------------------------------------------------------
    // STEP 6: Save the updated item
    // -------------------------------------------------------------------------
    try {
        await targetItem.update({ "system.advancement": advancements });
        ui.notifications?.info(`Added ${addedCount} items to advancement "${targetAdv.title}"`);
        Debug.Success(`Added ${addedCount} items to ${targetItem.name}`);
    } catch (error) {
        Debug.Error("Failed to update advancement:", error);
        ui.notifications?.error("Failed to update advancement. Check console.");
    }
}
