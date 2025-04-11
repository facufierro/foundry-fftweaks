namespace FFT {
    export class ItemMacro {
        static initialize() {
            Hooks.on("renderItemSheet", (_app, html) => this._onRenderItemSheet(html));

            Hooks.on("preCreateItem", async (item, data, options, userId) => {
                const source = await FFT.ItemMacro._getMacroSource(item);
                if (source?.includes("//RunOnPreCreate")) {
                    await (item as any).executeMacro();
                }
            });

            Hooks.on("createItem", async (item) => {
                const source = await FFT.ItemMacro._getMacroSource(item);
                if (source?.includes("//RunOnCreate")) {
                    await (item as any).executeMacro();
                }
            });

            Hooks.on("updateItem", async (item, changes) => {
                if (item.type === "class" && foundry.utils.hasProperty(changes, "system.levels")) {
                    const source = await FFT.ItemMacro._getMacroSource(item);
                    if (source?.includes("//RunOnUpdate")) {
                        await (item as any).executeMacro();
                    }
                }
            });
        }

        private static async _getMacroSource(item: any): Promise<string | null> {
            if (typeof item.getMacro !== "function" || !item.hasMacro?.()) return null;
            const macro = await item.getMacro();
            return macro?.command ?? null;
        }

        private static _onRenderItemSheet(html: JQuery) {
            const header = html.closest(".app").find(".window-header");
            const itemMacroBtn = header.find(".open-itemacro");
            if (!itemMacroBtn.length) return;

            itemMacroBtn
                .removeClass()
                .addClass("header-button control open-itemacro")
                .attr("data-tooltip", "Item Macro")
                .attr("aria-label", "Item Macro");

            const uuidButton = header.find(".document-id-link");
            uuidButton.length ? uuidButton.after(itemMacroBtn) : header.append(itemMacroBtn);
        }
    }
}
