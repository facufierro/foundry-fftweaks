namespace FFT.Modules {
    export class EquipmentManager {
        static isValidEvent(item, userId) {
            return game.user.isGM || userId === game.user.id && ["background", "class"].includes(item.type);
        }

        static async handleItemEvent(eventType: "create" | "remove", item, options, userId) {
            if (!this.isValidEvent(item, userId)) return;
            const data = await this.getEquipmentData(item);
            if (data?.equipmentKeys.length) {
                this.showDialog(eventType, data);
            }
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

        static async showDialog(eventType: "create" | "remove", data) {
            const { character, sourceName, equipmentKeys, equipmentNames } = data;
            const itemList = eventType === "create" ? `<ul>${equipmentNames.map(name => `<li>${name}</li>`).join("")}</ul>` : "";

            const content = `
                <p>${character.actor.name} has ${eventType === "create" ? "selected" : "removed"} a ${sourceName}. 
                Do you want to ${eventType} the following equipment?</p>
                ${itemList}
            `;

            new FF.CustomDialog(
                `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} ${sourceName} Equipment`,
                content,
                {
                    yes: {
                        label: "Yes",
                        callback: async () => {
                            if (eventType === "create") {
                                await character.addItemsByID(equipmentKeys);
                            } else {
                                await character.removeItemsByName(equipmentNames);
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
    }
}
