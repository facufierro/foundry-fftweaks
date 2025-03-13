namespace FFT {
    export class Character {
        public background: Item5e | null;
        public class: Item5e | null;
        public spells: Item5e[];
        public inventory: Record<string, Item5e[]>;

        constructor(public actor: Actor5e) {
            this.background = actor.items.find(i => String(i.type) === "background") ?? null;
            this.class = actor.items.find(i => String(i.type) === "class") ?? null;
            this.spells = actor.items.filter(i => String(i.type) === "spell") ?? [];

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
                const items = (await Promise.all(itemIds.map(id => fromUuid(id) as Promise<Item | null>))).filter(Boolean);
                await this.actor.createEmbeddedDocuments("Item", items.map(item => item.toObject()));
            }
            catch (error) {
                Debug.Error(error);
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
                const itemsToRemove = this.actor.items.filter(item => itemNames.includes(item.name));
                if (!itemsToRemove.length) return;
                await this.actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(item => item.id));
            }
            catch (error) {
                Debug.Error(error);
            }
        }
    }
}
