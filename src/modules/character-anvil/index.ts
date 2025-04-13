namespace FFT {
    export class CharacterAnvil {
        static initialize() {
            Hooks.on("createItem", (item: Item5e, options, userId) => {
                SpellSelector.refreshKnownSpells(new FFT.Character(item.parent));
            });
            Hooks.on("renderActorSheet5eCharacter", (app, html) => {
                PointBuySystem.renderButton(app.actor, html);
                SpellSelector.renderButton(app.actor, html);
                // LevelupManager.renderButton(app.actor, html);
            });



            // Hooks.on("updateItem", (item: Item5e, updateData, options, userId) => {
            //     this.handleActions(item, "spell", () => {
            //         let character = new Character(item.parent);
            //         SpellSelector.refreshKnownSpells(character);
            //     });
            //     this.handleActions(item, "class", async () => {
            //         let character = new Character(item.parent);
            //         SpellSelector.renderDialog(character);
            //     });
            // });

            // Hooks.on("deleteItem", (item: Item5e, options, userId) => {
            //     let character = new Character(item.parent);
            //     this.handleActions(item, "background", async () => {
            //         await EquipmentManager.renderDialog("deleteItem", character, item);
            //     });
            //     this.handleActions(item, "class", async () => {
            //         await EquipmentManager.renderDialog("deleteItem", character, item);
            //     });
            //     this.handleActions(item, "spell", () => {
            //         SpellSelector.refreshKnownSpells(character);
            //     });
            // });
        }

        static handleActions(item: Item5e, itemType: string, action: () => void) {
            if (item.type === itemType) {
                action();
            }
        }

    }
}
