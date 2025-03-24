namespace FFT {
    export class ItemMacro {
        static initialize() {
            Hooks.on("createItem", async (item, options, userId) => {
                await item.executeMacro();
            });
        }
    }
}
