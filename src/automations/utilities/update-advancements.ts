
export function advancementLinker() {
    Hooks.on("closeAdvancementConfig" as any, async (app: any) => {
        const item = app.advancement.item;
        if (!item) return;

        const advId = app.advancement.id;
        const sourceCompendiumIds = [
            "fftweaks.classes", "fftweaks.backgrounds", "fftweaks.species", "fftweaks.feats", "fftweaks.spells", "fftweaks.items"
        ];

        // Ensure packs are indexed before we try to match names
        const sourceMap = new Map();
        for (const id of sourceCompendiumIds) {
            const pack = game.packs.get(id);
            if (pack) {
                const index = await pack.getIndex();
                index.forEach((e: any) => sourceMap.set(e.name.toLowerCase(), `Compendium.${id}.Item.${e._id}`));
            }
        }

        // We only care about the advancement currently being edited/closed
        const adv = item.system.advancement.find((a: any) => a._id === advId);
        if (!adv) return;

        const isChoice = adv.type === "ItemChoice";
        const isGrant = adv.type === "ItemGrant";

        if (!isChoice && !isGrant) return;

        const currentItems = isChoice ? adv.configuration.pool : adv.configuration.items;
        if (!currentItems) return;

        let total = 0;

        const updates = await Promise.all(currentItems.map(async (entry: any) => {
            let uuid = entry.uuid;
            // We need to resolve the item to get its name to check against the map.
            const itemObj = await fromUuid(uuid);
            if (!itemObj) return entry; // Can't resolve, keep as is.

            const name = (itemObj as any).name.toLowerCase();
            const newUuid = sourceMap.get(name);

            if (newUuid && newUuid !== uuid) {
                total++;
                return { ...entry, uuid: newUuid };
            }
            return entry;
        }));

        if (total > 0) {
            if (isChoice) adv.configuration.pool = updates;
            else adv.configuration.items = updates;

            await item.update({ "system.advancement": item.system.advancement });
            ui.notifications?.info(`Updated ${total} items in ${item.name} advancement`);
        }
    });
}
