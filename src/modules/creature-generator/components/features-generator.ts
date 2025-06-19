namespace FFT {
    export class FeaturesGenerator {
        static async generateFeatures(
            templateFeatures: Feature[], 
            targetCR: number, 
            creatureType: CreatureType,
            actor: Actor
        ): Promise<void> {
            try {
                const availableFeatures = templateFeatures.filter(feature => 
                    feature.minCR <= targetCR
                );
                
                if (availableFeatures.length === 0) {
                    console.log(`FFTweaks | No features available for CR ${targetCR}`);
                    return;
                }
                
                // Determine feature limits based on creature type
                const featureLimits = this.getFeatureLimits(creatureType);
                
                // Separate guaranteed features from random ones
                const guaranteedFeatures = availableFeatures.filter(f => f.guaranteed || f.chance >= 100);
                const randomFeatures = availableFeatures.filter(f => !f.guaranteed && f.chance < 100);
                
                const selectedFeatures: Feature[] = [...guaranteedFeatures];
                
                // Add random features up to the limit
                const remainingSlots = Math.max(0, featureLimits.maxFeatures - guaranteedFeatures.length);
                
                if (remainingSlots > 0 && randomFeatures.length > 0) {
                    const shuffledFeatures = [...randomFeatures].sort(() => Math.random() - 0.5);
                    
                    for (const feature of shuffledFeatures) {
                        if (selectedFeatures.length >= featureLimits.maxFeatures) break;
                        
                        if (Math.random() * 100 < feature.chance) {
                            selectedFeatures.push(feature);
                        }
                    }
                }
                
                // Apply features to actor
                for (const feature of selectedFeatures) {
                    await this.applyFeatureToActor(feature, actor);
                }
                
                console.log(`FFTweaks | Applied ${selectedFeatures.length} features to ${actor.name}: ${selectedFeatures.map(f => f.name).join(', ')}`);
                
            } catch (error) {
                console.error("FFTweaks | Error generating features:", error);
            }
        }
        
        private static getFeatureLimits(creatureType: CreatureType): { maxFeatures: number } {
            switch (creatureType) {
                case "minion": return { maxFeatures: 0 };
                case "standard": return { maxFeatures: 1 };
                case "elite": return { maxFeatures: 2 };
                case "boss": return { maxFeatures: 3 };
                default: return { maxFeatures: 1 };
            }
        }
        
        private static async applyFeatureToActor(feature: Feature, actor: Actor): Promise<void> {
            try {
                // Try to find the feature in compendiums first
                const existingFeature = await this.findFeatureByName(feature.name);
                
                if (existingFeature) {
                    // Use existing feature from compendium
                    await actor.createEmbeddedDocuments("Item", [existingFeature.toObject()]);
                } else {
                    // Create custom feature
                    const featureData = {
                        name: feature.name,
                        type: "feat",
                        system: {
                            description: {
                                value: feature.description,
                                chat: "",
                                unidentified: ""
                            },
                            source: "FFTweaks Creature Generator",
                            activation: {
                                type: "",
                                cost: 0,
                                condition: ""
                            },
                            duration: {
                                value: null,
                                units: ""
                            },
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
                                recovery: ""
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
                            requirements: "",
                            recharge: {
                                value: null,
                                charged: true
                            }
                        }
                    };
                    
                    await actor.createEmbeddedDocuments("Item", [featureData]);
                }
                
            } catch (error) {
                console.error(`FFTweaks | Error applying feature ${feature.name}:`, error);
            }
        }
        
        private static async findFeatureByName(featureName: string): Promise<Item | null> {
            try {
                // Search in fftweaks.features compendium first
                const fftweaksFeaturesPack = game.packs.get("fftweaks.features");
                if (fftweaksFeaturesPack) {
                    await fftweaksFeaturesPack.getIndex();
                    const entry = fftweaksFeaturesPack.index.find((i: any) => i.name?.toLowerCase() === featureName.toLowerCase());
                    if (entry) {
                        const document = await fftweaksFeaturesPack.getDocument(entry._id!);
                        if (document && ((document as Item).type === "feat" || (document as Item).type === "feature")) {
                            return document as Item;
                        }
                    }
                }
                
                // Search in world items
                let feature = game.items?.find((i: any) => 
                    i.name?.toLowerCase() === featureName.toLowerCase() && 
                    (i.type === "feat" || i.type === "feature")
                );
                if (feature) return feature;
                
                // Search in other compendiums as fallback
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item" && pack.collection !== "fftweaks.features") {
                        await pack.getIndex();
                        const entry = pack.index.find((i: any) => i.name?.toLowerCase() === featureName.toLowerCase());
                        if (entry) {
                            const item = await pack.getDocument(entry._id!);
                            if (item && ((item as Item).type === "feat" || (item as Item).type === "feature")) {
                                return item as Item;
                            }
                        }
                    }
                }
                
                return null;
                
            } catch (error) {
                console.error(`FFTweaks | Error finding feature ${featureName}:`, error);
                return null;
            }
        }
        
        static createCustomFeature(name: string, description: string, options: any = {}): any {
            return {
                name,
                type: "feat",
                system: {
                    description: {
                        value: description,
                        chat: "",
                        unidentified: ""
                    },
                    source: "FFTweaks Creature Generator",
                    ...options
                }
            };
        }
    }
}
