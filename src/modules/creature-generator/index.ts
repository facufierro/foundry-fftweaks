namespace FFT {
    export class CreatureGeneratorModule {
        static async initialize(): Promise<void> {
            try {
                // Initialize the creature generator component
                await CreatureGeneratorComponent.initialize();
                
                // Set up hooks
                this.setupHooks();
                
                // Set up console API
                this.setupConsoleAPI();
                
                console.log("FFTweaks | Creature Generator Module initialized");
                
            } catch (error) {
                console.error("FFTweaks | Failed to initialize Creature Generator Module:", error);
            }
        }
        
        private static setupHooks(): void {
            // Hook into token creation for automatic enhancement
            Hooks.on("createToken", async (tokenDocument: TokenDocument) => {
                try {
                    if (!game.user?.isGM) return;
                    
                    const actor = tokenDocument.actor;
                    if (!actor || actor.type !== "npc") return;
                    
                    // Check if actor has the auto-generate flag or is unnamed/generic
                    const shouldAutoGenerate = (actor as any).getFlag("fftweaks", "autoGenerate") ||
                                             this.isGenericNPC(actor);
                    
                    if (shouldAutoGenerate) {
                        console.log(`FFTweaks | Auto-generating creature for: ${actor.name}`);
                        
                        // Determine template based on actor name or type
                        const templateName = this.determineTemplate(actor);
                        const creatureType = this.determineCreatureType(actor);
                        
                        await CreatureGeneratorComponent.enhanceExistingActor(
                            actor,
                            templateName,
                            { creatureType }
                        );
                    }
                    
                } catch (error) {
                    console.error("FFTweaks | Error in createToken hook:", error);
                }
            });
        }
        
        private static setupConsoleAPI(): void {
            // Expose API to global FFT namespace
            if (!(window as any).FFT) {
                (window as any).FFT = {};
            }
            
            (window as any).FFT.CreatureGenerator = {
                // Main generation function
                generateCreature: async (actorName: string, templateName: string = "guard", options: any = {}) => {
                    return await CreatureGeneratorComponent.generateCreature(actorName, templateName, options);
                },

                // Enhance existing actor
                enhanceActor: async (actor: Actor, templateName: string = "guard", options: any = {}) => {
                    return await CreatureGeneratorComponent.enhanceExistingActor(actor, templateName, options);
                },
                
                // Convenience functions for each creature type
                generateMinion: async (actorName: string, templateName: string = "guard") => {
                    return await CreatureGeneratorComponent.generateCreature(actorName, templateName, { creatureType: "minion" });
                },
                
                generateStandard: async (actorName: string, templateName: string = "guard") => {
                    return await CreatureGeneratorComponent.generateCreature(actorName, templateName, { creatureType: "standard" });
                },
                
                generateElite: async (actorName: string, templateName: string = "guard") => {
                    return await CreatureGeneratorComponent.generateCreature(actorName, templateName, { creatureType: "elite" });
                },
                
                generateBoss: async (actorName: string, templateName: string = "guard") => {
                    return await CreatureGeneratorComponent.generateCreature(actorName, templateName, { creatureType: "boss" });
                },
                
                // Utility functions
                getAvailableTemplates: () => {
                    return CreatureGeneratorComponent.getAvailableTemplates();
                },
                
                reloadTemplates: async () => {
                    return await CreatureGeneratorComponent.reloadTemplates();
                },
                
                calculateCR: (partyLevel: number, partySize: number, difficulty: string, creatureType: string) => {
                    return CRCalculator.calculateTargetCR(
                        partyLevel,
                        partySize,
                        difficulty as EncounterDifficulty,
                        creatureType as CreatureType
                    );
                }
            };
            
            console.log("FFTweaks | Creature Generator API exposed to console");
        }
        
        private static isGenericNPC(actor: Actor): boolean {
            // Check if this is a generic/unnamed NPC that should be auto-generated
            const genericNames = [
                "guard", "soldier", "bandit", "cultist", "acolyte",
                "commoner", "noble", "knight", "archer", "warrior",
                "new actor", "npc", "creature"
            ];
            
            const actorName = (actor as any).name?.toLowerCase() || "";
            return genericNames.some(name => actorName.includes(name));
        }
        
        private static determineTemplate(actor: Actor): string {
            const actorName = (actor as any).name?.toLowerCase() || "";
            
            // Simple template matching based on name
            if (actorName.includes("guard") || actorName.includes("soldier") || actorName.includes("warrior")) {
                return "guard";
            }
            
            // Default to guard template for now
            return "guard";
        }
        
        private static determineCreatureType(actor: Actor): CreatureType {
            const actorName = (actor as any).name?.toLowerCase() || "";
            
            // Determine creature type based on name keywords
            if (actorName.includes("minion") || actorName.includes("weak")) {
                return "minion";
            } else if (actorName.includes("elite") || actorName.includes("veteran")) {
                return "elite";
            } else if (actorName.includes("boss") || actorName.includes("captain") || actorName.includes("leader")) {
                return "boss";
            }
            
            return "standard";
        }
    }
}