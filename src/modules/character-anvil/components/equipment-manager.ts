namespace FFT.Modules {
    export class EquipmentManager {
        static isValidEvent(item, userId) {
            return game.user.isGM || userId === game.user.id && ["background", "class"].includes(item.type);
        }
        static async handleItemEvent(eventType: "create" | "remove", item, options, userId) {
            if (!this.isValidEvent(item, userId)) return;

            // Add 'await' when calling getEquipmentData
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

            // Fetch item names dynamically from UUIDs, ensuring TypeScript recognizes them as Items
            const equipmentItems = await Promise.all(
                equipmentKeys.map(async (id) => {
                    const foundItem = await fromUuid(id) as Item | null; // Explicitly type as Item
                    return foundItem?.name || null;
                })
            );

            const equipmentNames = equipmentItems.filter(Boolean); // Remove null values

            console.log("Retrieved equipment data:", {
                equipmentKeys,
                equipmentNames
            });

            return {
                character,
                sourceType: item.type === "background" ? "backgroundSource" : "classSource",
                sourceName: item.type === "background" ? "Background" : "Class",
                equipmentKeys,
                equipmentNames
            };
        }




        static async showDialog(eventType: "create" | "remove", data) {
            const { character, sourceName, sourceType, equipmentKeys, equipmentNames } = data;
            let itemList = "";

            if (eventType === "create") {
                itemList = equipmentNames.map(name => `<li>${name}</li>`).join("");
            }

            const title = eventType === "create" ? `Add ${sourceName} Equipment` : `Remove ${sourceName} Equipment`;
            const content = eventType === "create"
                ? `<p>${character.actor.name} has selected a ${sourceName}. Do you want to add the following equipment?</p><ul>${itemList}</ul>`
                : `<p>${character.actor.name} has removed a ${sourceName}. Do you want to remove the associated equipment?</p>`;

            new FF.CustomDialog(title, content, {
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
            }, "yes").render();
        }
    }
}
