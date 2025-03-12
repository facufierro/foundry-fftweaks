namespace FFT.Modules {
    export class CharacterAnvil {
        static initialize() {
            Hooks.on("preCreateItem", (item, options, userId) => {
                if (item.type === "class") {
                    FFT.Modules.EquipmentManager.showDialog("create", "class", item, userId);
                    FFT.Modules.SpellSelector.showDialog("add", "Fireball", userId);
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
