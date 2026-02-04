export async function addFolderToAdvancement(advancementUuid: string): Promise<void> {
    const folder = game.folders?.find(f => f.name === "Import" && f.type === "Item");
    if (!folder) {
        ui.notifications?.warn("Missing 'Import' folder");
        return;
    }

    const parts = advancementUuid.split(".Advancement.");
    if (parts.length < 2) {
        ui.notifications?.error("Invalid UUID");
        return;
    }

    const item = await fromUuid(parts[0]);
    if (!item) return;

    const advancements = (item.toObject() as any).system.advancement;
    const adv = advancements.find((a: any) => a._id === parts[1]);
    if (!adv) return;

    const isChoice = adv.type === "ItemChoice";
    const collection = isChoice ? (adv.configuration.pool ??= []) : (adv.configuration.items ??= []);
    const sourceCompendiumIds = ["fftweaks.classes", "fftweaks.backgrounds", "fftweaks.species", "fftweaks.feats", "fftweaks.spells", "fftweaks.items"];

    const compendiumIndices = await Promise.all(sourceCompendiumIds.map(async (id) => {
        const pack = game.packs.get(id);
        return pack ? { id, index: await pack.getIndex() } : null;
    }));

    const currentUuids = new Set(collection.map((x: any) => x.uuid));
    const toAdd: any[] = [];

    for (const folderItem of (folder.contents as any[])) {
        if (currentUuids.has(folderItem.uuid)) continue;

        let finalUuid = folderItem.uuid;
        const itemName = (folderItem as any).name.toLowerCase();

        for (const entry of compendiumIndices) {
            const match = entry?.index.find((i: any) => i.name.toLowerCase() === itemName);
            if (match) {
                finalUuid = `Compendium.${entry!.id}.Item.${match._id}`;
                break;
            }
        }

        if (!collection.some((c: any) => c.uuid === finalUuid)) {
            toAdd.push({ uuid: finalUuid, ...(isChoice ? {} : { optional: false }) });
        }
    }

    if (toAdd.length) {
        collection.push(...toAdd);
        await (item as any).update({ "system.advancement": advancements });
        ui.notifications?.info(`Added ${toAdd.length} items`);
    }
}
