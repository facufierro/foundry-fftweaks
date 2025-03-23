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

// if (item.type === "class") {
//     FFT.Modules.EquipmentManager.showDialog("create", item.type, item, userId);

// const spellListId = "fltmd5kijx3pTREA.GEc89WbpwBlsqP2z";
// const { spells, title, category } = await FFT.Modules.SpellSelector.getSpellData(spellListId);

// const actor = item.parent;
// if (!actor || !(actor instanceof Actor)) {
//     console.warn("No valid actor found for this item.");
//     return;
// }

// const classAdvancement = true;
// if (Object.keys(spells).length > 0) {
//     FFT.Modules.SpellSelector.showDialog(spells, title, category, actor, game.user.id, classAdvancement);
// } else {
//     console.warn("No spells found, skipping dialog.");
// }
// }

// if (item.type === "background") {
//     FFT.Modules.EquipmentManager.showDialog("create", "background", item, userId);
// }
//         });

//         Hooks.on("preDeleteItem", (item, options, userId) => {
//             switch (item.type) {
//                 case "class":
//                     FFT.Modules.EquipmentManager.showDialog("remove", item.type, item, userId);
//                     break;
//                 case "background":
//                     FFT.Modules.EquipmentManager.showDialog("remove", item.type, item, userId);
//                     break;
//                 default:
//                     break;
//             }

//         FFT.Modules.PointBuySystem.initialize();