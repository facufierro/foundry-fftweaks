namespace FFT.Modules {
    export class EquipmentManager {
        static isValidEvent(item, userId) {
            return game.user.isGM || (userId === game.user.id && ["background", "class"].includes(item.type));
        }

        static async handleItemEvent(eventType: "create" | "remove", item, options, userId) {
            if (!this.isValidEvent(item, userId)) return;
            if (!["background", "class"].includes(item.type)) return; // Ensure only backgrounds/classes trigger

            const actor = item.parent;
            if (!actor) return;
            const character = new FFT.Character(actor);
            const sourceType = item.type === "background" ? "backgroundSource" : "classSource";
            const sourceName = item.type === "background" ? "Background" : "Class";

            const content = `
                <p>${character.actor.name} has ${eventType === "create" ? "selected" : "removed"} a ${sourceName}. 
                Do you want to ${eventType} the associated equipment?</p>
            `;

            new FF.CustomDialog(
                `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} ${sourceName} Equipment`,
                content,
                {
                    yes: {
                        label: "Yes",
                        callback: async () => {
                            const data = await EquipmentManager.getEquipmentData(item);
                            if (!data || !data.equipmentKeys.length) return;

                            if (eventType === "create") {
                                await character.addItemsByID(data.equipmentKeys);
                            } else {
                                await character.removeItemsByName(data.equipmentNames);
                            }
                            ui.notifications.info(`${sourceName} equipment ${eventType}d!`);
                        }
                    },
                    no: {
                        label: "No",
                        callback: () => ui.notifications.info(`${sourceName} equipment was not ${eventType}d.`)
                    }
                },
                "yes"
            ).render();
        }

        static async getEquipmentData(item) {
            const actor = item.parent;
            if (!actor) return null;
            const character = new FFT.Character(actor);
            const equipmentKeys = item.system?.startingEquipment?.map(e => e.key)?.filter(Boolean) || [];

            const equipmentNames = (await Promise.all(
                equipmentKeys.map(async (id) => {
                    const foundItem = await fromUuid(id) as Item | null;
                    return foundItem?.name || null;
                })
            )).filter(Boolean);

            return {
                character,
                sourceType: item.type === "background" ? "backgroundSource" : "classSource",
                sourceName: item.type === "background" ? "Background" : "Class",
                equipmentKeys,
                equipmentNames
            };
        }
    }
}
