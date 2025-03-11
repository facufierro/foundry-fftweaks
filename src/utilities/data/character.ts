namespace FFT {
    export class Character {
        public background: Item | null;
        public class: Item | null;

        constructor(public actor: Actor) {
            this.background = actor.items.find(i => i.type === "background") ?? null;
            this.class = actor.items.find(i => i.type === "class") ?? null;
        }

        async addItemsByID(itemIds: string[]): Promise<void> {
            const items = (await Promise.all(itemIds.map(id => fromUuid(id) as Promise<Item | null>))).filter(Boolean);
            if (!items.length) return;
            await this.actor.createEmbeddedDocuments("Item", items.map(item => item.toObject()));
        }

        async removeItemsByID(itemIds: string[]): Promise<void> {
            await this.actor.deleteEmbeddedDocuments("Item", itemIds);
        }

        async removeItemsByName(itemNames: string[]): Promise<void> {
            console.log("Attempting to remove items:", itemNames);
            const itemsToRemove = this.actor.items.filter(item => itemNames.includes(item.name));
            console.log("Found items to remove:", itemsToRemove.map(item => item.name));
            if (!itemsToRemove.length) return;
            await this.actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(item => item.id));
        }

    }
}
