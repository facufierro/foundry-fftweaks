import { Debug } from "../../utils/debug";

interface AdvancementItem {
    name: string;
    type: string;
    uuid: string;
    broken: boolean;
}

interface AdvancementData {
    id: string;
    title: string;
    type: string;
    items: AdvancementItem[];
}

interface ItemAdvancementData {
    id: string;
    advancements: AdvancementData[];
    subclasses?: Record<string, ItemAdvancementData>;
    subspecies?: Record<string, ItemAdvancementData>;
}

interface CategoryData {
    [itemName: string]: ItemAdvancementData;
}

interface ClassesData {
    _Shared: CategoryData;
    [className: string]: CategoryData | ItemAdvancementData;
}

interface HierarchicalSyncData {
    classes: ClassesData;
    backgrounds: CategoryData;
    species: CategoryData;
    feats: {
        "Origin Feats": CategoryData;
        "General Feats": CategoryData;
        "Other": CategoryData;
    };
}

export class AdvancementSync {
    private static readonly COMPENDIUMS = [
        "fftweaks.classes",
        "fftweaks.backgrounds",
        "fftweaks.species",
        "fftweaks.feats"
    ];
    private static readonly DATA_PATH = "modules/fftweaks/src/plugins/advancement-sync/data";

    private static readonly ORIGIN_FEATS = [
        "alert", "crafter", "healer", "lucky", "magic initiate", "musician",
        "savage attacker", "skilled", "tavern brawler", "tough"
    ];

    private static syncTimeout: ReturnType<typeof setTimeout> | null = null;

    static initialize(): void {
        // Sync when a target compendium is opened
        Hooks.on("renderCompendium", this.onRenderCompendium.bind(this));
        this.syncAll();
        Debug.Log("AdvancementSync initialized");
    }

    private static onRenderCompendium(app: any, html: any, data: any): void {
        const packId = app.collection?.metadata?.id;
        if (!packId || !this.COMPENDIUMS.includes(packId)) return;

        // Sync when compendium is opened
        Debug.Log(`Compendium opened: ${packId}`);
        this.syncAll();
    }

    static async syncAll(): Promise<void> {
        Debug.Log("Starting advancement sync...");

        const syncData: HierarchicalSyncData = {
            classes: { _Shared: {} },
            backgrounds: {},
            species: {},
            feats: {
                "Origin Feats": {},
                "General Feats": {},
                "Other": {}
            }
        };

        // Track classes/subclasses and species/subspecies for linking
        const classItems: Map<string, { id: string; name: string; data: ItemAdvancementData }> = new Map();
        const subclassItems: { doc: any; data: ItemAdvancementData; classIdentifier: string }[] = [];
        const sharedFeatures: Map<string, ItemAdvancementData> = new Map();
        const speciesItems: Map<string, { id: string; name: string; data: ItemAdvancementData }> = new Map();
        const subspeciesItems: { doc: any; data: ItemAdvancementData; speciesIdentifier: string }[] = [];

        for (const compendiumId of this.COMPENDIUMS) {
            const pack = game.packs.get(compendiumId);
            if (!pack) {
                Debug.Warn(`Compendium not found: ${compendiumId}`);
                continue;
            }

            const documents = await pack.getDocuments() as any[];

            for (const doc of documents) {
                const itemData = await this.processItem(doc);
                const data: ItemAdvancementData = itemData || { id: doc.id, advancements: [] };

                const docType = doc.type;
                const docName = doc.name;

                if (compendiumId === "fftweaks.classes") {
                    if (docType === "class") {
                        const identifier = doc.system?.identifier || docName.toLowerCase().replace(/\s+/g, "-");
                        classItems.set(identifier, { id: doc.id, name: docName, data });
                    } else if (docType === "subclass") {
                        subclassItems.push({
                            doc,
                            data,
                            classIdentifier: doc.system?.classIdentifier || ""
                        });
                    } else if (itemData) {
                        // Features with advancements - track for shared detection
                        sharedFeatures.set(doc.id, data);
                    }
                } else if (compendiumId === "fftweaks.backgrounds") {
                    if (docType === "background") {
                        syncData.backgrounds[docName] = data;
                    }
                } else if (compendiumId === "fftweaks.species") {
                    if (docType === "race") {
                        const identifier = doc.system?.identifier || docName.toLowerCase().replace(/\s+/g, "-");
                        speciesItems.set(identifier, { id: doc.id, name: docName, data });
                    } else {
                        const parentIdentifier = doc.system?.type?.value || "";
                        if (parentIdentifier) {
                            subspeciesItems.push({ doc, data, speciesIdentifier: parentIdentifier });
                        } else if (itemData) {
                            syncData.species[docName] = data;
                        }
                    }
                } else if (compendiumId === "fftweaks.feats") {
                    if (itemData) {
                        const category = this.categorizeFeat(docName);
                        syncData.feats[category][docName] = data;
                    }
                }
            }
        }

        // Link subclasses to parent classes
        for (const { doc, data, classIdentifier } of subclassItems) {
            const parentClass = classItems.get(classIdentifier);
            if (parentClass) {
                if (!parentClass.data.subclasses) parentClass.data.subclasses = {};
                parentClass.data.subclasses[doc.name] = data;
            } else {
                syncData.classes._Shared[doc.name] = data;
                Debug.Warn(`Orphan subclass: ${doc.name} (classIdentifier: ${classIdentifier})`);
            }
        }

        // Add all classes
        for (const [, classInfo] of classItems) {
            (syncData.classes as any)[classInfo.name] = classInfo.data;
        }

        // All features with advancements go to _Shared
        for (const [, featureData] of sharedFeatures) {
            // Find the name by reverse lookup
            const pack = game.packs.get("fftweaks.classes");
            if (pack) {
                for (const indexEntry of pack.index) {
                    const entry = indexEntry as any;
                    if (entry._id === featureData.id) {
                        syncData.classes._Shared[entry.name] = featureData;
                        break;
                    }
                }
            }
        }

        // Link subspecies to parent species
        for (const { doc, data, speciesIdentifier } of subspeciesItems) {
            const parentSpecies = speciesItems.get(speciesIdentifier);
            if (parentSpecies) {
                if (!parentSpecies.data.subspecies) parentSpecies.data.subspecies = {};
                parentSpecies.data.subspecies[doc.name] = data;
            } else {
                syncData.species[doc.name] = data;
            }
        }

        // Add all species
        for (const [, speciesInfo] of speciesItems) {
            syncData.species[speciesInfo.name] = speciesInfo.data;
        }

        await this.writeData(syncData);
    }

    private static async processItem(doc: any): Promise<ItemAdvancementData | null> {
        const advancements = doc.system?.advancement || [];
        if (advancements.length === 0) return null;

        const itemData: ItemAdvancementData = {
            id: doc.id,
            advancements: []
        };

        for (const adv of advancements) {
            if (!["ItemGrant", "ItemChoice"].includes(adv.type)) continue;

            const advData: AdvancementData = {
                id: adv._id,
                title: adv.title || adv.type,
                type: adv.type,
                items: []
            };

            const config = adv.configuration || {};
            const entries = (adv.type === "ItemChoice" ? config.pool : config.items) || [];

            for (const entry of (entries as any[])) {
                const uuid = entry.uuid;
                if (!uuid) {
                    advData.items.push({ name: "[MISSING UUID]", type: "unknown", uuid: "", broken: true });
                    continue;
                }

                const subItem = await fromUuid(uuid) as any;
                if (subItem) {
                    advData.items.push({ name: subItem.name, type: subItem.type, uuid, broken: false });
                } else {
                    advData.items.push({ name: "[BROKEN]", type: "unknown", uuid, broken: true });
                }
            }

            if (advData.items.length > 0) {
                advData.items.sort((a, b) => a.name.localeCompare(b.name));
                itemData.advancements.push(advData);
            }
        }

        return itemData.advancements.length > 0 ? itemData : null;
    }

    private static categorizeFeat(name: string): "Origin Feats" | "General Feats" | "Other" {
        const lowerName = name.toLowerCase();
        for (const origin of this.ORIGIN_FEATS) {
            if (lowerName.startsWith(origin)) return "Origin Feats";
        }
        return "General Feats";
    }

    private static async writeData(data: HierarchicalSyncData): Promise<void> {
        const sortedData: HierarchicalSyncData = {
            classes: this.sortClassesData(data.classes),
            backgrounds: this.sortCategory(data.backgrounds),
            species: this.sortCategoryWithNested(data.species, "subspecies"),
            feats: {
                "Origin Feats": this.sortCategory(data.feats["Origin Feats"]),
                "General Feats": this.sortCategory(data.feats["General Feats"]),
                "Other": this.sortCategory(data.feats["Other"])
            }
        };

        const jsonString = JSON.stringify(sortedData, null, 2);
        const file = new File([jsonString], "advancements.json", { type: "application/json" });

        // Temporarily suppress all notifications during upload
        const originalNotify = ui.notifications?.info;
        const originalWarn = ui.notifications?.warn;
        if (ui.notifications) {
            ui.notifications.info = () => null as any;
            ui.notifications.warn = () => null as any;
        }

        try {
            // V13+ support
            if (foundry.applications?.apps?.FilePicker?.upload) {
                await foundry.applications.apps.FilePicker.upload("data", this.DATA_PATH, file, {});
            }
            // V12 and below support
            else if (FilePicker.upload) {
                await FilePicker.upload("data", this.DATA_PATH, file, {});
            }
        } catch (error) {
            Debug.Error("Failed to write advancement data:", error);
        } finally {
            // Restore original notification methods
            if (ui.notifications && originalNotify && originalWarn) {
                ui.notifications.info = originalNotify;
                ui.notifications.warn = originalWarn;
            }
        }
    }

    private static sortClassesData(data: ClassesData): ClassesData {
        const sorted: ClassesData = { _Shared: this.sortCategory(data._Shared) };

        const classNames = Object.keys(data).filter(k => k !== "_Shared").sort((a, b) => a.localeCompare(b));
        for (const name of classNames) {
            const item = { ...(data[name] as ItemAdvancementData) };
            if (item.subclasses) {
                item.subclasses = this.sortCategory(item.subclasses);
            }
            sorted[name] = item;
        }
        return sorted;
    }

    private static sortCategory(category: CategoryData): CategoryData {
        const sorted: CategoryData = {};
        for (const key of Object.keys(category).sort((a, b) => a.localeCompare(b))) {
            sorted[key] = category[key];
        }
        return sorted;
    }

    private static sortCategoryWithNested(category: CategoryData, nestedKey: "subclasses" | "subspecies"): CategoryData {
        const sorted: CategoryData = {};
        for (const key of Object.keys(category).sort((a, b) => a.localeCompare(b))) {
            const item = { ...category[key] };
            if (item[nestedKey]) {
                item[nestedKey] = this.sortCategory(item[nestedKey] as CategoryData);
            }
            sorted[key] = item;
        }
        return sorted;
    }
}
