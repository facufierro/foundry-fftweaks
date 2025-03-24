namespace FFT {
    export class CharacterAnvil {
        static initialize() {
            Hooks.on("renderActorSheet5eCharacter", (app, html) => {
                PointBuySystem.renderButton(app.actor, html);
                SpellSelector.renderButton(app.actor, html);
            });

            Hooks.on("createItem", async (item: Item5e, options, userId) => {
                let character = new Character(item.parent);

                this.handleActions(item, "background", () => {
                    EquipmentManager.renderDialog("createItem", character, item);
                });

                this.handleActions(item, "class", () => {
                    SpellSelector.renderDialog(character);
                    EquipmentManager.renderDialog("createItem", character, item);
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
                    EquipmentManager.renderDialog("deleteItem", character, item);
                });
                this.handleActions(item, "class", () => {
                    EquipmentManager.renderDialog("deleteItem", character, item);
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
