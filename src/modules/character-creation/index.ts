namespace FFT.Modules {
    export class StartingEquipment {
        static initialize() {
            // Detect when a background is added
            Hooks.on("preCreateItem", async (item, options, userId) => {
                if (!game.user.isGM && userId !== game.user.id) return;
                if (item.type !== "background") return;

                const actor = item.parent;
                if (!actor) return;

                const equipmentKeys = item.system?.startingEquipment?.map(e => e.key)?.filter(Boolean) || [];
                if (!equipmentKeys.length) {
                    ui.notifications.warn(`${actor.name} selected a background, but no equipment was found.`);
                    return;
                }

                let equipmentList = "";
                for (const key of equipmentKeys) {
                    const equipmentItem = await fromUuid(key) as Item;
                    if (equipmentItem?.name) {
                        equipmentList += `<li>${equipmentItem.name}</li>`;
                    }
                }

                new Dialog({
                    title: "Add Background Equipment",
                    content: `<p>${actor.name} has selected a background. Do you want to add the following equipment?</p>
                              <ul>${equipmentList}</ul>`,
                    buttons: {
                        yes: {
                            label: "Yes",
                            callback: async () => {
                                for (const key of equipmentKeys) {
                                    const item = await fromUuid(key) as Item;
                                    if (!item) continue;
                                    let newItem = await actor.createEmbeddedDocuments("Item", [item.toObject()]);

                                    // Mark the item as background-given for tracking
                                    if (newItem.length) {
                                        await newItem[0].setFlag("dnd5e", "backgroundSource", item.uuid);
                                    }
                                }
                                ui.notifications.info("Background equipment added!");
                            }
                        },
                        no: {
                            label: "No",
                            callback: () => {
                                ui.notifications.info("Background equipment not added.");
                            }
                        }
                    },
                    default: "yes"
                }).render(true);
            });

            // Detect when a background is removed
            Hooks.on("preDeleteItem", async (item, options, userId) => {
                if (!game.user.isGM && userId !== game.user.id) return;
                if (item.type !== "background") return;

                const actor = item.parent;
                if (!actor) return;

                const equipmentKeys = item.system?.startingEquipment?.map(e => e.key)?.filter(Boolean) || [];
                if (!equipmentKeys.length) return;

                // Find and remove items that were given by the background
                const itemsToRemove = actor.items.filter(i => i.getFlag("dnd5e", "backgroundSource") && equipmentKeys.includes(i.getFlag("dnd5e", "backgroundSource")));
                if (!itemsToRemove.length) return;

                new Dialog({
                    title: "Remove Background Equipment",
                    content: `<p>${actor.name} has removed a background. Do you want to remove the associated equipment?</p>`,
                    buttons: {
                        yes: {
                            label: "Yes",
                            callback: async () => {
                                await actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(i => i.id));
                                ui.notifications.info("Background equipment removed!");
                            }
                        },
                        no: {
                            label: "No",
                            callback: () => {
                                ui.notifications.info("Background equipment was kept.");
                            }
                        }
                    },
                    default: "yes"
                }).render(true);
            });
        }
    }
}
