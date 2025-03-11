namespace FFT.Modules {
    export class CharacterAnvil {
        static initialize() {

            Hooks.on("preCreateItem", (item, options, userId) => FFT.Modules.EquipmentManager.handleItemEvent("create", item, options, userId));
            Hooks.on("preDeleteItem", (item, options, userId) => FFT.Modules.EquipmentManager.handleItemEvent("remove", item, options, userId));

            FFT.Modules.PointBuySystem.initialize();
        }

    }
}
