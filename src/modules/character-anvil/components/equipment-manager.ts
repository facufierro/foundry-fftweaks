namespace FFT {
    export class EquipmentManager {

        static async showDialog(event: String, character: Character, item: Item5e) {
            if (item.type === "class" || item.type === "background") {
                new CustomDialog(
                    `Equipment Manager`,
                    `<p>${character.actor.name} has added/removed a ${item.type}.</p>
                    <p>Do you want to add/remove its associated items?</p>`,
                    {
                        yes: {
                            label: "Yes",
                            callback: async () => {
                                const data = await EquipmentManager.getEquipmentData(character, item);
                                if (event.toLowerCase().includes("create")) {
                                    await character.addItemsByID(data.startingEquipmentIDs);
                                } else {
                                    await character.removeItemsByName(data.startingEquipmentNames);
                                }
                            }
                        },
                        no: {
                            label: "No",
                            callback: () => {

                            }
                        }
                    },
                    "yes"
                ).render();
            }
        }

        static async getEquipmentData(character: Character, item: Item5e) {
            if (!character || !item) return null;
            const compendiumId = "fftweaks.backgrounds";
            const compendium = game.packs.get(compendiumId);

            const compendiumItem = await compendium?.getDocuments().then((pack) =>
                (pack as Item5e[]).find(i => i.name === item.name)
            );

            item = compendiumItem ?? item;
            const startingEquipmentIDs: string[] = (item?.system?.startingEquipment as { key: string }[] | undefined)?.map(e => e.key) ?? [];
            const startingEquipmentNames: string[] = await Promise.all((item?.system?.startingEquipment as { key: string }[] | undefined)?.map(e => fromUuid(e.key).then((i: any) => i?.name ?? "Unknown")) ?? []);

            return { startingEquipmentIDs, startingEquipmentNames };
        }
    }
}
