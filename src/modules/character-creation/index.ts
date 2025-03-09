namespace FFT.Modules {
    export class StartingEquipment {
        static initialize() {
            Hooks.on("preCreateItem", async (item, options, userId) => {
                if (!game.user.isGM && userId !== game.user.id) return;
                if (item.type !== "background" && item.type !== "class") return;

                const actor = item.parent;
                if (!actor) return;

                const sourceType = item.type === "background" ? "backgroundSource" : "classSource";
                const sourceName = item.type === "background" ? "Background" : "Class";

                let equipmentKeys: string[] = [];

                if (item.type === "background") {
                    equipmentKeys = item.system?.startingEquipment?.map(e => e.key)?.filter(Boolean) || [];
                } else if (item.type === "class") {
                    equipmentKeys = item.system?.startingEquipment?.map(e => e.key)?.filter(Boolean) || [];
                }

                if (!equipmentKeys.length) {
                    ui.notifications.warn(`${actor.name} selected a ${sourceName}, but no equipment was found.`);
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
                    title: `Add ${sourceName} Equipment`,
                    content: `<p>${actor.name} has selected a ${sourceName}. Do you want to add the following equipment?</p>
                              <ul>${equipmentList}</ul>`,
                    buttons: {
                        yes: {
                            label: "Yes",
                            callback: async () => {
                                for (const key of equipmentKeys) {
                                    const item = await fromUuid(key) as Item;
                                    if (!item) continue;
                                    let newItem = await actor.createEmbeddedDocuments("Item", [item.toObject()]);

                                    if (newItem.length) {
                                        await newItem[0].setFlag("dnd5e", sourceType, item.uuid);
                                    }
                                }
                                ui.notifications.info(`${sourceName} equipment added!`);
                            }
                        },
                        no: {
                            label: "No",
                            callback: () => {
                                ui.notifications.info(`${sourceName} equipment not added.`);
                            }
                        }
                    },
                    default: "yes"
                }).render(true);
            });

            Hooks.on("preDeleteItem", async (item, options, userId) => {
                if (!game.user.isGM && userId !== game.user.id) return;
                if (item.type !== "background" && item.type !== "class") return;

                const actor = item.parent;
                if (!actor) return;

                const sourceType = item.type === "background" ? "backgroundSource" : "classSource";
                const sourceName = item.type === "background" ? "Background" : "Class";

                let equipmentKeys: string[] = [];

                if (item.type === "background") {
                    equipmentKeys = item.system?.startingEquipment?.map(e => e.key)?.filter(Boolean) || [];
                } else if (item.type === "class") {
                    equipmentKeys = item.system?.startingEquipment?.map(e => e.key)?.filter(Boolean) || [];
                }

                if (!equipmentKeys.length) return;

                const itemsToRemove = actor.items.filter(i => i.getFlag("dnd5e", sourceType) && equipmentKeys.includes(i.getFlag("dnd5e", sourceType)));
                if (!itemsToRemove.length) return;

                new Dialog({
                    title: `Remove ${sourceName} Equipment`,
                    content: `<p>${actor.name} has removed a ${sourceName}. Do you want to remove the associated equipment?</p>`,
                    buttons: {
                        yes: {
                            label: "Yes",
                            callback: async () => {
                                await actor.deleteEmbeddedDocuments("Item", itemsToRemove.map(i => i.id));
                                ui.notifications.info(`${sourceName} equipment removed!`);
                            }
                        },
                        no: {
                            label: "No",
                            callback: () => {
                                ui.notifications.info(`${sourceName} equipment was kept.`);
                            }
                        }
                    },
                    default: "yes"
                }).render(true);
            });
        }
    }
}
