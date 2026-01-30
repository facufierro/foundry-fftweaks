export class AdvancementSync {
    static initialize() {
        Hooks.on("closeCompendium", (app: any) => {
            if (["fftweaks.classes", "fftweaks.backgrounds", "fftweaks.species", "fftweaks.feats"].includes(app.collection?.metadata?.id)) this.syncAll();
        });
    }

    static async syncAll() {
        const data: any = { classes: { _Shared: {} }, backgrounds: {}, species: {}, feats: { "Origin Feats": {}, "General Feats": {}, "Other": {} } };
        const maps = { class: new Map(), species: new Map() };
        const subs: any[] = [];

        for (const packId of ["fftweaks.classes", "fftweaks.backgrounds", "fftweaks.species", "fftweaks.feats"]) {
            const pack = game.packs.get(packId);
            if (!pack) continue;
            const isClass = packId.includes("classes"), isSpecies = packId.includes("species");

            for (const doc of (await pack.getDocuments() as any[])) {
                const advs = doc.system?.advancement?.filter((a: any) => ["ItemGrant", "ItemChoice"].includes(a.type)) || [];
                const entry: any = { id: doc.id, advancements: [] };

                for (const adv of advs) {
                    const pool = (adv.type === "ItemChoice" ? adv.configuration?.pool : adv.configuration?.items) || [];
                    const items = (await Promise.all(pool.map(async (i: any) => {
                        const item = i.uuid ? await fromUuid(i.uuid) : null;
                        return { name: (item as any)?.name || "[BROKEN]", type: (item as any)?.type || "unknown", uuid: i.uuid || "", broken: !item };
                    }))).sort((a: any, b: any) => a.name.localeCompare(b.name));
                    if (items.length) entry.advancements.push({ id: adv._id, title: adv.title || adv.type, type: adv.type, items });
                }

                if (isClass) {
                    if (doc.type === "class") maps.class.set(doc.system?.identifier || doc.name.toLowerCase().replace(/\s+/g, "-"), { name: doc.name, data: entry });
                    else if (doc.type === "subclass") subs.push({ doc, data: entry, parentId: doc.system?.classIdentifier, type: "class" });
                    else if (entry.advancements.length) data.classes._Shared[doc.name] = entry;
                } else if (isSpecies) {
                    if (doc.type === "race") maps.species.set(doc.system?.identifier || doc.name.toLowerCase().replace(/\s+/g, "-"), { name: doc.name, data: entry });
                    else if (doc.system?.type?.value) subs.push({ doc, data: entry, parentId: doc.system.type.value, type: "species" });
                    else if (entry.advancements.length) data.species[doc.name] = entry;
                } else if (packId.includes("backgrounds") && entry.advancements.length) data.backgrounds[doc.name] = entry;
                else if (packId.includes("feats") && entry.advancements.length) {
                    const cat = ["alert", "crafter", "healer", "lucky", "magic initiate", "musician", "savage attacker", "skilled", "tavern brawler", "tough"].some(f => doc.name.toLowerCase().startsWith(f)) ? "Origin Feats" : "General Feats";
                    data.feats[cat][doc.name] = entry;
                }
            }
        }

        subs.forEach(({ doc, data: d, parentId, type }) => {
            const p = (maps as any)[type].get(parentId);
            if (p) (p.data[type === "class" ? "subclasses" : "subspecies"] ??= {})[doc.name] = d;
            else if (d.advancements.length) type === "class" ? data.classes._Shared[doc.name] = d : data.species[doc.name] = d;
        });

        maps.class.forEach(({ name, data: d }) => data.classes[name] = d);
        maps.species.forEach(({ name, data: d }) => data.species[name] = d);

        const sort: any = (o: any) => (typeof o !== "object" || !o || Array.isArray(o)) ? o : Object.keys(o).sort().reduce((a: any, k) => (a[k] = sort(o[k]), a), {});
        try {
            const file = new File([JSON.stringify(sort(data), null, 2)], "advancements.json", { type: "application/json" });
            const fp = (foundry.applications?.apps?.FilePicker) || FilePicker;
            if (fp?.upload) await fp.upload("data", "assets/fftweaks/data", file, {});
        } catch (e) { }
    }
}
