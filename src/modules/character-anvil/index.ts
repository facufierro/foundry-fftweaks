namespace FFT {
    export class CharacterAnvil {
        static initialize() {

            Hooks.on("createItem", async (item: Item5e, options, userId) => {
                let character = new Character(item.parent);

                this.handleActions(item, "background", () => {
                    EquipmentManager.showDialog("createItem", character, item);
                });

                this.handleActions(item, "class", () => {
                    EquipmentManager.showDialog("createItem", character, item);
                    SpellSelector.showDialog(character);
                });

                this.handleActions(item, "spell", () => {
                    SpellSelector.refreshKnownSpells(character);
                });
            });

            Hooks.on("updateItem", (item: Item5e, updateData, options, userId) => {
                this.handleActions(item, "spell", () => {
                    let character = new Character(item.parent);
                    SpellSelector.refreshKnownSpells(character);
                });
            });

            Hooks.on("deleteItem", (item: Item5e, options, userId) => {
                let character = new Character(item.parent);
                this.handleActions(item, "background", () => {
                    EquipmentManager.showDialog("deleteItem", character, item);
                });
                this.handleActions(item, "class", () => {
                    EquipmentManager.showDialog("deleteItem", character, item);
                    SpellSelector.showDialog(character);
                });
                this.handleActions(item, "spell", () => {
                    SpellSelector.refreshKnownSpells(character);
                });
            });
        }

        static handleActions(item: Item5e, itemType: string, action: () => void) {
            if (item.type === itemType) {
                action();
            }
        }

    }
}
