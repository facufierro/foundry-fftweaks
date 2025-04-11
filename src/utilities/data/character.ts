namespace FFT {
    export class Character {
        public background: Item5e | null;
        public class: Item5e | null;
        public species: Item5e | null;
        public spells: Item5e[];
        public inventory: Record<string, Item5e[]>;

        constructor(public actor: Actor5e) {
            this.background = actor.items.find(i => String(i.type) === "background") ?? null;
            this.class = actor.items.find(i => i.type === "class") ?? null;
            this.spells = actor.items.filter(i => String(i.type) === "spell") ?? [];
            this.species = actor.items.find(i => String(i.type) === "race") ?? null;
            this.inventory = {
                consumable: [],
                container: [],
                equipment: [],
                loot: [],
                tool: [],
                weapon: []
            };

            actor.items.forEach(item => {
                const itemType = String(item.type).toLowerCase();
                if (this.inventory[itemType]) {
                    this.inventory[itemType].push(item);
                }
            });
        }

        async addItemsByID(itemIds: string[]): Promise<void> {
            try {
                if (itemIds.length === 0) {
                    Debug.Error("No item IDs provided.");
                    return;
                }

                // Fetch items from the compendium by UUID
                const items = (await Promise.all(itemIds.map(async (id) => {
                    try {
                        const item = await fromUuid(id) as Item | null;
                        if (!item) {
                            Debug.Error(`Item with ID ${id} not found.`);
                        }
                        return item;
                    } catch (err) {
                        Debug.Error(`Failed to load item with ID ${id}: ${err.message}`);
                        return null;
                    }
                }))).filter(Boolean);

                // If items were found, add them to the actor's inventory
                if (items.length > 0) {
                    await this.actor.createEmbeddedDocuments("Item", items.map(item => item.toObject()));
                } else {
                    Debug.Error("No valid items found to add.");
                }
            } catch (error) {
                Debug.Error(`An unexpected error occurred: ${error.message}`);
            }
        }
        async addItemsByName(itemNames: string[], compendiumId: string): Promise<void> {
            const pack = game.packs.get(compendiumId);
            if (!pack) return;

            const index = await pack.getIndex();
            const items = await Promise.all(itemNames.map(async name => {
                const entry = index.find(e => e.name === name);
                return entry ? await pack.getDocument(entry._id) as Item5e : null;
            }));

            const validItems = items.filter((i): i is Item5e => i !== null);
            if (validItems.length) {
                await this.actor.createEmbeddedDocuments(
                    "Item", 
                    validItems.map(i => i.toObject())
                );
            }
        }

        async removeItemsByID(itemIds: string[]): Promise<void> {
            try {
                if (!itemIds.length) return;
                await this.actor.deleteEmbeddedDocuments("Item", itemIds);
            }
            catch (error) {
                Debug.Error(error);
            }
        }

        async removeItemsByName(itemNames: string[]): Promise<void> {
            try {
                let itemsToRemove: string[] = [];

                for (const name of itemNames) {
                    const item = this.actor.items.find(item => item.name === name);
                    if (item) {
                        itemsToRemove.push(item.id);
                    }
                }

                if (itemsToRemove.length === 0) return;

                await this.actor.deleteEmbeddedDocuments("Item", itemsToRemove);
            } catch (error) {
                Debug.Error(error);
            }
        }

        canLevelUp(): boolean {
            let result: boolean;
            if (this.class) {
                const xp = foundry.utils.getProperty(this.actor, "system.details.xp.value") ?? 0;
                const required = foundry.utils.getProperty(this.actor, "system.details.xp.max") ?? Infinity;
                result = xp >= required;
            } else {
                result = true;
            }
            return result;
        }

    }
}
