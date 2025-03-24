namespace FFT {
    export class ItemMacro {
        static initialize() {
            Hooks.on("renderItemSheet", (_app, html) => {
                const header = html.closest(".app").find(".window-header");
                const itemMacroBtn = header.find(".open-itemacro");

                if (!itemMacroBtn.length) return;

                // Style it like other buttons
                itemMacroBtn
                    .removeClass()
                    .addClass("header-button control open-itemacro")
                    .attr("data-tooltip", "Item Macro")
                    .attr("aria-label", "Item Macro");

                // Move it after the UUID button (or after title if needed)
                const uuidButton = header.find(".document-id-link");
                if (uuidButton.length) {
                    uuidButton.after(itemMacroBtn);
                } else {
                    header.append(itemMacroBtn); // fallback
                }
                console.log("Found and moved ItemMacro button");
            });
            Hooks.on("createItem", async (item, options, userId) => {
                await item.executeMacro();
            });
            Hooks.on("updateItem", async (item, changes) => {
                if (item.type === "class" && foundry.utils.hasProperty(changes, "system.levels")) {
                    await item.executeMacro();
                }
            });


        }
    }
}
