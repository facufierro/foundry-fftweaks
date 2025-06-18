namespace FFT {
    export class FeaturesGenerator {
        private static readonly FEATURES_COMPENDIUM_NAME = "fftweaks.features";

        static async applyFeaturesToActor(actor: Actor, template: CreatureTemplate): Promise<boolean> {
            if (!actor || !template.features || template.features.length === 0) {
                console.log(`FeaturesGenerator: No features to apply for ${actor?.name || 'unknown actor'}`);
                return false;
            }

            try {
                const targetCR = CRCalculator.getTargetCR(template.type, template.baseCR);
                console.log(`FeaturesGenerator: Target CR for ${actor.name}: ${targetCR}`);
                
                const featuresToAdd = this.rollForFeatures(template.features, targetCR);
                console.log(`FeaturesGenerator: Rolled ${featuresToAdd.length} features from ${template.features.length} possible features`);

                if (featuresToAdd.length === 0) {
                    console.log(`FeaturesGenerator: No features rolled for ${actor.name}`);
                    return true;
                }

                await this.addFeaturesToActor(actor, featuresToAdd);
                console.log(`FeaturesGenerator: Successfully added ${featuresToAdd.length} features to ${actor.name}`);
                return true;

            } catch (error) {
                console.error(`FeaturesGenerator: Error applying features to ${actor.name}:`, error);
                return false;
            }
        }

        private static rollForFeatures(features: FeatureItem[], currentCR: number): FeatureItem[] {
            const successfulFeatures: FeatureItem[] = [];

            console.log(`FeaturesGenerator: Rolling for features with CR ${currentCR}`);

            for (const feature of features) {
                // Check CR requirement
                if (feature.requiresCR && currentCR < feature.requiresCR) {
                    console.log(`FeaturesGenerator: Skipping "${feature.name}" - requires CR ${feature.requiresCR}, current CR ${currentCR}`);
                    continue;
                }

                // Add ±15% randomization to feature chances
                const baseChance = feature.chance || 100;
                const randomizedChance = Math.max(5, Math.min(95, baseChance + (Math.random() * 30 - 15)));
                const roll = Math.random() * 100;
                
                console.log(`FeaturesGenerator: Rolling for "${feature.name}" - chance ${randomizedChance.toFixed(1)}%, rolled ${roll.toFixed(1)}`);
                
                if (roll <= randomizedChance) {
                    console.log(`FeaturesGenerator: Successfully rolled for "${feature.name}"`);
                    successfulFeatures.push(feature);
                } else {
                    console.log(`FeaturesGenerator: Failed roll for "${feature.name}"`);
                }
            }

            return successfulFeatures;
        }

        private static async addFeaturesToActor(actor: Actor, featureItems: FeatureItem[]): Promise<void> {
            const itemsToCreate: any[] = [];

            console.log(`FeaturesGenerator: Processing ${featureItems.length} features for ${actor.name}`);

            for (const featureItem of featureItems) {
                console.log(`FeaturesGenerator: Looking for feature "${featureItem.name}"`);
                
                let featureData = await this.findFeatureInCompendium(featureItem.name);

                if (!featureData) {
                    console.log(`FeaturesGenerator: Feature "${featureItem.name}" not found in compendium, creating placeholder`);
                    featureData = this.createPlaceholderFeature(featureItem.name);
                } else {
                    console.log(`FeaturesGenerator: Feature "${featureItem.name}" found in compendium`);
                }

                const itemToAdd = foundry.utils.duplicate(featureData);
                itemsToCreate.push(itemToAdd);
            }

            if (itemsToCreate.length > 0) {
                console.log(`FeaturesGenerator: Adding ${itemsToCreate.length} features to ${actor.name}`);
                await actor.createEmbeddedDocuments("Item", itemsToCreate);
            } else {
                console.log(`FeaturesGenerator: No features to add to ${actor.name}`);
            }
        }

        private static async findFeatureInCompendium(featureName: string): Promise<any | null> {
            try {
                const compendium = game.packs.get(this.FEATURES_COMPENDIUM_NAME);
                if (!compendium) {
                    console.warn(`FeaturesGenerator: Compendium ${this.FEATURES_COMPENDIUM_NAME} not found`);
                    return null;
                }

                const index = await compendium.getIndex();
                const featureEntry = index.find((entry: any) =>
                    entry.name.toLowerCase() === featureName.toLowerCase()
                );

                if (!featureEntry) {
                    return null;
                }

                const featureDocument = await compendium.getDocument(featureEntry._id);
                return featureDocument?.toObject();

            } catch (error) {
                console.warn(`FeaturesGenerator: Error searching compendium for ${featureName}:`, error);
                return null;
            }
        }

        private static createPlaceholderFeature(featureName: string): any {
            return {
                name: featureName,
                type: "feat",
                img: "icons/svg/upgrade.svg",
                system: {
                    description: {
                        value: `<p><strong>${featureName}</strong></p><p><em>This feature was not found in the compendium and needs to be configured manually.</em></p>`,
                        chat: "",
                        unidentified: ""
                    },
                    source: {
                        custom: "",
                        rules: "2024",
                        revision: 1
                    },
                    activation: {
                        type: "",
                        cost: 0,
                        condition: ""
                    },
                    duration: {
                        value: null,
                        units: ""
                    },
                    cover: null,
                    crewed: false,
                    target: {
                        value: null,
                        width: null,
                        units: "",
                        type: ""
                    },
                    range: {
                        value: null,
                        long: null,
                        units: ""
                    },
                    uses: {
                        value: null,
                        max: "",
                        per: null,
                        recovery: []
                    },
                    consume: {
                        type: "",
                        target: null,
                        amount: null
                    },
                    ability: null,
                    actionType: "",
                    attackBonus: "",
                    chatFlavor: "",
                    critical: {
                        threshold: null,
                        damage: ""
                    },
                    damage: {
                        parts: [],
                        versatile: ""
                    },
                    formula: "",
                    save: {
                        ability: "",
                        dc: null,
                        scaling: "spell"
                    },
                    type: {
                        value: "passive",
                        subtype: ""
                    },
                    requirements: "",
                    recharge: {
                        value: null,
                        charged: true
                    }
                },
                effects: [],
                ownership: {
                    default: 0
                },
                flags: {},
                activities: {}
            };
        }

        static async generateFeatures(actorName?: string): Promise<void> {
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

            const templateName = actor.name ? (actor.name as string).toLowerCase().replace(/\s+/g, "-") : null;
            if (!templateName) {
                ui.notifications?.warn("Actor has no name for template lookup.");
                return;
            }

            try {
                const template = await this.loadTemplate(templateName);
                if (!template) {
                    ui.notifications?.warn(`No template found for ${templateName}`);
                    return;
                }

                const success = await this.applyFeaturesToActor(actor, template);
                if (success) {
                    ui.notifications?.info(`Features applied to ${actor.name}`);
                } else {
                    ui.notifications?.warn(`Failed to apply features to ${actor.name}`);
                }
            } catch (error) {
                console.error(`FeaturesGenerator: Error in generateFeatures:`, error);
                ui.notifications?.error(`Error generating features: ${error}`);
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
                console.warn(`FeaturesGenerator: Could not load template ${templateName}:`, error);
                return null;
            }
        }
    }
}
