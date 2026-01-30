export async function updateAdvancements(targetUuid: string, sourceCompendiumIds: string[] | string = [
    "fftweaks.classes", "fftweaks.backgrounds", "fftweaks.species", "fftweaks.feats", "fftweaks.spells", "fftweaks.items"
]): Promise<void> {
    const parts = targetUuid.split(".");
    if (parts[0] !== "Compendium" || parts.length < 4) return;

    const advId = parts.includes("Advancement") ? parts[parts.indexOf("Advancement") + 1] : null;
    const item = await fromUuid(advId ? parts.slice(0, parts.indexOf("Advancement")).join(".") : targetUuid) as any;
    if (!item) return;

    const data = await fetch("/assets/fftweaks/data/advancements.json").then(r => r.json()).catch((): null => null);
    if (!data) return;

    const findData = (o: any, id: string): any => {
        if (!o || typeof o !== "object") return null;
        if (o.id === id) return o;
        for (const k in o) {
            const res = findData(o[k], id);
            if (res) return res;
        }
    };
    const saved = findData(data, parts[4]);
    if (!saved) return;

    const sourceMap = new Map();
    for (const id of (Array.isArray(sourceCompendiumIds) ? sourceCompendiumIds : [sourceCompendiumIds])) {
        const pack = game.packs.get(id);
        if (pack) pack.index.forEach((e: any) => sourceMap.set(e.name.toLowerCase(), `Compendium.${id}.Item.${e._id}`));
    }

    const updates = item.system.advancement.filter((a: any) => advId ? a._id === advId : saved.advancements.some((s: any) => s.id === a._id));
    let total = 0;

    for (const adv of updates) {
        const savedAdv = saved.advancements.find((s: any) => s.id === adv._id);
        if (!savedAdv) continue;

        const isChoice = adv.type === "ItemChoice";
        const entries = savedAdv.items.map((s: any) => {
            const name = s.name.toLowerCase();
            const newUuid = sourceMap.get(name);
            if (newUuid && newUuid !== s.uuid) total++;
            const uuid = newUuid || s.uuid;
            return isChoice ? { uuid } : { uuid, optional: false };
        });

        if (isChoice) adv.configuration.pool = entries;
        else adv.configuration.items = entries;
    }

    if (total > 0) {
        await item.update({ "system.advancement": item.system.advancement });
        ui.notifications?.info(`Updated ${total} items in ${item.name}`);
    } else {
        ui.notifications?.info(`All items in ${item.name} up to date.`);
    }
}
