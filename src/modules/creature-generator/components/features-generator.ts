namespace FFT {
    export class FeaturesGenerator {
        private static readonly FEATURES_COMPENDIUM_NAME = "fftweaks.features";
        private static featuresList: any = null;

        static async applyFeaturesToActor(actor: Actor, template: CreatureTemplate): Promise<boolean> {
            if (!actor) {
                console.log(`FeaturesGenerator: No actor provided`);
                return false;
            }

            try {
                const targetCR = CRCalculator.getTargetCR(template.type, template.baseCR);
                console.log(`FeaturesGenerator: Target CR for ${actor.name}: ${targetCR}`);
                
                // Load features list if not already loaded
                if (!this.featuresList) {
                    await this.loadFeaturesList();
                }

                // Generate features from the features list based on CR
                const featuresToAdd = await this.generateFeaturesForCR(targetCR, template.type);
                console.log(`FeaturesGenerator: Generated ${featuresToAdd.length} features for CR ${targetCR}`);

                if (featuresToAdd.length === 0) {
                    console.log(`FeaturesGenerator: No features generated for ${actor.name}`);
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

        private static async loadFeaturesList(): Promise<void> {
            try {
                const response = await fetch('/modules/fftweaks/src/modules/creature-generator/data/features-list.json');
                if (!response.ok) {
                    throw new Error(`Failed to load features list: ${response.statusText}`);
                }
                this.featuresList = await response.json();
                console.log('FeaturesGenerator: Features list loaded successfully');
            } catch (error) {
                console.error('FeaturesGenerator: Error loading features list:', error);
                this.featuresList = { combat: { offensive: [], defensive: [], tactical: [] }, social: { leadership: [] } };
            }
        }

        private static async generateFeaturesForCR(targetCR: number, creatureType: string): Promise<FeatureItem[]> {
            const features: FeatureItem[] = [];
            
            // Limit number of features based on CR
            let maxFeatures = 1; // Standard creatures get 1 feature
            if (targetCR >= 5) maxFeatures = 2; // Higher CR can get 2
            if (targetCR >= 10) maxFeatures = 3; // Very high CR can get 3

            console.log(`FeaturesGenerator: Generating up to ${maxFeatures} features for CR ${targetCR}`);

            // Select features from different categories
            const categories = [
                this.featuresList.combat.offensive,
                this.featuresList.combat.defensive,
                this.featuresList.combat.tactical,
                this.featuresList.social.leadership
            ];

            const availableFeatures = categories.flat().filter((feature: any) => 
                this.isFeatureAvailableForCR(feature, targetCR)
            );

            console.log(`FeaturesGenerator: ${availableFeatures.length} features available for CR ${targetCR}`);

            // Randomly select features
            for (let i = 0; i < maxFeatures && availableFeatures.length > 0; i++) {
                // Base chance starts at 40% for first feature, decreases for additional features
                const baseChance = 40 - (i * 15);
                const roll = Math.random() * 100;
                
                console.log(`FeaturesGenerator: Rolling for feature ${i + 1} - chance ${baseChance}%, rolled ${roll.toFixed(1)}`);
                
                if (roll <= baseChance) {
                    const randomIndex = Math.floor(Math.random() * availableFeatures.length);
                    const selectedFeature = availableFeatures.splice(randomIndex, 1)[0];
                    
                    features.push({
                        name: selectedFeature.name,
                        chance: 100 // Already rolled, so guarantee it gets added
                    });
                    
                    console.log(`FeaturesGenerator: Selected feature "${selectedFeature.name}"`);
                }
            }

            return features;
        }

        private static isFeatureAvailableForCR(feature: any, cr: number): boolean {
            if (!feature.crRange || feature.crRange.length !== 2) {
                return true; // If no CR range specified, available for all CRs
            }
            
            const [minCR, maxCR] = feature.crRange;
            return cr >= minCR && cr <= maxCR;
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
