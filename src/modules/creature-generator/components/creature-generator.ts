namespace FFT {
    export class CreatureGenerator {
        static async generateFullCreature(actor: Actor, templateName?: string): Promise<boolean> {
            if (!actor) {
                console.warn("CreatureGenerator: No actor provided");
                return false;
            }

            const templateToUse = templateName || (actor.name ? (actor.name as string).toLowerCase().replace(/\s+/g, "-") : null);
            if (!templateToUse) {
                console.warn("CreatureGenerator: No template name available");
                return false;
            }

            try {
                const template = await this.loadTemplate(templateToUse);
                if (!template) {
                    console.log(`CreatureGenerator: No template found for ${templateToUse}`);
                    return false;
                }

                console.log(`CreatureGenerator: Generating ${template.type} creature with base CR ${template.baseCR}`);

                let success = true;

                // Apply stats first as they affect other generators
                if (template.stats) {
                    const statsSuccess = await StatsGenerator.applyStatsToActor(actor, template);
                    if (!statsSuccess) {
                        console.warn("CreatureGenerator: Failed to apply stats");
                        success = false;
                    }
                }

                // Apply equipment
                if (template.equipment) {
                    const equipmentSuccess = await EquipmentGenerator.applyEquipmentToActor(actor, template);
                    if (!equipmentSuccess) {
                        console.warn("CreatureGenerator: Failed to apply equipment");
                        success = false;
                    }
                }

                // Apply features
                if (template.features) {
                    const featuresSuccess = await FeaturesGenerator.applyFeaturesToActor(actor, template);
                    if (!featuresSuccess) {
                        console.warn("CreatureGenerator: Failed to apply features");
                        success = false;
                    }
                }

                // Apply spells
                if (template.spells) {
                    const spellsSuccess = await SpellsGenerator.applySpellsToActor(actor, template);
                    if (!spellsSuccess) {
                        console.warn("CreatureGenerator: Failed to apply spells");
                        success = false;
                    }
                }

                if (success) {
                    const targetCR = CRCalculator.getTargetCR(template.type, template.baseCR);
                    console.log(`CreatureGenerator: Successfully generated ${actor.name} as ${template.type} (CR: ${targetCR})`);
                }

                return success;

            } catch (error) {
                console.error(`CreatureGenerator: Error generating creature ${actor.name}:`, error);
                return false;
            }
        }

        static async generateCreature(actorName?: string): Promise<void> {
            let actor: Actor | null = null;

            if (actorName) {
                actor = game.actors?.find(a => a.name && (a.name as string).toLowerCase() === actorName.toLowerCase()) || null;
            } else {
                const selectedTokens = canvas.tokens?.controlled || [];
                if (selectedTokens.length === 1) {
                    actor = selectedTokens[0].actor;
                }
            }

            if (!actor) {
                ui.notifications?.warn("No valid actor found. Please select a token or provide an actor name.");
                return;
            }

            const success = await this.generateFullCreature(actor);
            if (success) {
                ui.notifications?.info(`Full creature generation applied to ${actor.name}`);
            } else {
                ui.notifications?.warn(`Failed to fully generate creature for ${actor.name}`);
            }
        }

        private static async loadTemplate(templateName: string): Promise<CreatureTemplate | null> {
            try {
                const response = await fetch(`modules/fftweaks/src/modules/creature-generator/data/${templateName}.json`);
                if (!response.ok) {
                    return null;
                }
                const template: CreatureTemplate = await response.json();
                return template;
            } catch (error) {
                console.warn(`CreatureGenerator: Could not load template ${templateName}:`, error);
                return null;
            }
        }

        static getPartyInfo(): PartyInfo {
            return CRCalculator.calculatePartyCR();
        }

        static getTargetCR(creatureType: CreatureType, baseCR?: number): number {
            return CRCalculator.getTargetCR(creatureType, baseCR);
        }

        // Utility methods for manual generation
        static async generateStatsOnly(actorName?: string): Promise<void> {
            await StatsGenerator.generateStats(actorName);
        }

        static async generateEquipmentOnly(actorName?: string): Promise<void> {
            await EquipmentGenerator.generateEquipment(actorName);
        }

        static async generateFeaturesOnly(actorName?: string): Promise<void> {
            await FeaturesGenerator.generateFeatures(actorName);
        }

        static async generateSpellsOnly(actorName?: string): Promise<void> {
            await SpellsGenerator.generateSpells(actorName);
        }
    }
}
