/// <reference path="types.ts" />
/// <reference path="components/cr-calculator.ts" />
/// <reference path="components/stats-generator.ts" />
/// <reference path="components/equipment-generator.ts" />
/// <reference path="components/features-generator.ts" />
/// <reference path="components/spells-generator.ts" />
/// <reference path="components/creature-generator.ts" />

namespace FFT {
    export class CreatureGeneratorModule {
        static initialize() {
            Hooks.on("createToken", async (tokenDocument: TokenDocument) => {
                const actor = tokenDocument.actor;
                if (!actor || actor.hasPlayerOwner) {
                    return;
                }

                setTimeout(async () => {
                    // Use the new comprehensive creature generator
                    await CreatureGenerator.generateFullCreature(actor);
                }, 100);
            });

            // Register console commands for manual generation
            if (typeof window !== "undefined") {
                (window as any).FFTCreatureGenerator = {
                    generateCreature: CreatureGenerator.generateCreature,
                    generateStats: CreatureGenerator.generateStatsOnly,
                    generateEquipment: CreatureGenerator.generateEquipmentOnly,
                    generateFeatures: CreatureGenerator.generateFeaturesOnly,
                    generateSpells: CreatureGenerator.generateSpellsOnly,
                    getPartyInfo: CreatureGenerator.getPartyInfo,
                    getTargetCR: CreatureGenerator.getTargetCR
                };
            }
        }
    }
}