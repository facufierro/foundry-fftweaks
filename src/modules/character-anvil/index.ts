namespace FFT.Modules {
    export class CharacterAnvil {
        static initialize() {
            Hooks.on("createItem", async (item, options, userId) => {
                if (item.type === "class") {
                    FFT.Modules.EquipmentManager.showDialog("create", "class", item, userId);

                    const spellListId = "fltmd5kijx3pTREA.GEc89WbpwBlsqP2z";
                    const spells = await FFT.Modules.SpellSelector.getSpellData(spellListId);

                    if (Object.keys(spells).length > 0) {
                        FFT.Modules.SpellSelector.showDialog(spells, game.user.id); // ✅ Pass spell dictionary
                    } else {
                        console.warn("No spells found, skipping dialog.");
                    }
                }
                if (item.type === "background") {
                    FFT.Modules.EquipmentManager.showDialog("create", "background", item, userId);
                }
            });

            Hooks.on("preDeleteItem", (item, options, userId) => {
                if (item.type === "class") {
                    FFT.Modules.EquipmentManager.showDialog("remove", "class", item, userId);
                }
                if (item.type === "background") {
                    FFT.Modules.EquipmentManager.showDialog("remove", "background", item, userId);
                }
            });

            FFT.Modules.PointBuySystem.initialize();
        }
    }
}
