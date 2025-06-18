namespace FFT {
    export class CreatureGeneratorModule {
        static initialize() {
            Hooks.on("createToken", async (tokenDocument: TokenDocument) => {
                const actor = tokenDocument.actor;
                if (!actor || actor.hasPlayerOwner) {
                    return;
                }

                setTimeout(async () => {
                    await EquipmentGenerator.applyEquipmentToActor(actor);
                }, 100);
            });
        }
    }
}