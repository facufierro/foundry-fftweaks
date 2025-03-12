namespace FFT.Modules {
    export class EquipmentManager {
        static isValidEvent(userId) {
            return game.user.isGM || userId === game.user.id;
        }

        static async showDialog(eventType: "create" | "remove", itemType: string, item, userId) {
            if (!this.isValidEvent(userId)) return;
            if (!item || item.type !== itemType) return;

            const actor = item.parent;
            if (!actor) return;
            const character = new FFT.Character(actor);

            const content = `
                <p>${character.actor.name} has ${eventType === "create" ? "selected" : "removed"} a ${itemType}.</p>
                <p>Do you want to ${eventType} its associated items?</p>
            `;

            new FF.CustomDialog(
                `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} ${itemType} Items`,
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

                            ui.notifications.info(`${itemType} items ${eventType}d!`);
                        }
                    },
                    no: {
                        label: "No",
                        callback: () => ui.notifications.info(`${itemType} items were not ${eventType}d.`)
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
                sourceType: item.type,
                sourceName: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                equipmentKeys,
                equipmentNames
            };
        }
    }
}
