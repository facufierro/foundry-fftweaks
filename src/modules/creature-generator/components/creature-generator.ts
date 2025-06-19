namespace FFT {
    export class CreatureGeneratorComponent {
        private static templates: Map<string, CreatureTemplate> = new Map();
        private static initialized = false;
        
        static async initialize(): Promise<void> {
            if (this.initialized) return;
            
            try {
                await this.loadTemplates();
                this.initialized = true;
                console.log("FFTweaks | Creature Generator initialized successfully");
            } catch (error) {
                console.error("FFTweaks | Failed to initialize Creature Generator:", error);
            }
        }
        
        private static async loadTemplates(): Promise<void> {
            try {
                // Load guard template
                const guardTemplate = await this.loadTemplate("guard");
                if (guardTemplate) {
                    this.templates.set("guard", guardTemplate);
                }
                
                console.log(`FFTweaks | Loaded ${this.templates.size} creature templates`);
            } catch (error) {
                console.error("FFTweaks | Error loading templates:", error);
            }
        }
        
        private static async loadTemplate(templateName: string): Promise<CreatureTemplate | null> {
            try {
                const response = await fetch(`modules/fftweaks/src/modules/creature-generator/data/${templateName}.json`);
                if (!response.ok) {
                    console.warn(`FFTweaks | Template file not found: ${templateName}.json`);
                    return null;
                }
                
                const template: CreatureTemplate = await response.json();
                this.validateTemplate(template);
                return template;
                
            } catch (error) {
                console.error(`FFTweaks | Error loading template ${templateName}:`, error);
                return null;
            }
        }
        
        private static validateTemplate(template: CreatureTemplate): void {
            if (!template.name || !template.type || !template.variants) {
                throw new Error("Invalid template structure");
            }
            
            const requiredVariants: CreatureType[] = ["minion", "standard", "elite", "boss"];
            for (const variant of requiredVariants) {
                if (!template.variants[variant]) {
                    throw new Error(`Missing variant: ${variant}`);
                }
            }
        }
        
        static async generateCreature(
            actorName: string, 
            templateName: string = "guard", 
            options: GenerationOptions = {}
        ): Promise<Actor | null> {
            try {
                if (!this.initialized) {
                    await this.initialize();
                }
                
                const template = this.templates.get(templateName);
                if (!template) {
                    console.error(`FFTweaks | Template not found: ${templateName}`);
                    return null;
                }
                
                // Set defaults
                const partyLevel = options.partyLevel ?? this.getAveragePartyLevel();
                const partySize = options.partySize ?? this.getPartySize();
                const difficulty = options.difficulty ?? "medium";
                const creatureType = options.creatureType ?? "standard";
                
                // Calculate target CR
                const crResult = CRCalculator.calculateTargetCR(partyLevel, partySize, difficulty, creatureType);
                console.log(`FFTweaks | Target CR for ${creatureType}: ${crResult.finalCR} (base: ${crResult.targetCR}, modifier: ${crResult.modifier})`);
                
                // Get variant template
                const variant = template.variants[creatureType];
                
                // Generate creature
                const actor = await this.createActor(actorName, template.type, crResult.finalCR);
                if (!actor) {
                    console.error("FFTweaks | Failed to create actor");
                    return null;
                }
                
                // Generate and apply stats
                const scaledStats = StatsGenerator.generateStats(variant.stats, crResult.finalCR);
                await this.applyStats(actor, scaledStats);
                
                // Generate equipment
                await EquipmentGenerator.generateEquipment(variant.equipment, actor);
                
                // Generate features
                await FeaturesGenerator.generateFeatures(variant.features, crResult.finalCR, creatureType, actor);
                
                // Generate spells if template has them
                if (variant.spells) {
                    await SpellsGenerator.generateSpells(variant.spells, crResult.finalCR, creatureType, actor);
                }
                
                // Finalize CR
                await this.finalizeCR(actor, crResult.finalCR);
                
                console.log(`FFTweaks | Successfully generated ${creatureType} ${actorName} (CR ${crResult.finalCR})`);
                return actor;
                
            } catch (error) {
                console.error("FFTweaks | Error generating creature:", error);
                return null;
            }
        }
        
        static async enhanceExistingActor(
            actor: Actor,
            templateName: string = "guard", 
            options: GenerationOptions = {}
        ): Promise<Actor | null> {
            try {
                if (!this.initialized) {
                    await this.initialize();
                }
                
                const template = this.templates.get(templateName);
                if (!template) {
                    console.error(`FFTweaks | Template not found: ${templateName}`);
                    return null;
                }
                
                // Set defaults
                const partyLevel = options.partyLevel ?? this.getAveragePartyLevel();
                const partySize = options.partySize ?? this.getPartySize();
                const difficulty = options.difficulty ?? "medium";
                const creatureType = options.creatureType ?? "standard";
                
                // Calculate target CR
                const crResult = CRCalculator.calculateTargetCR(partyLevel, partySize, difficulty, creatureType);
                console.log(`FFTweaks | Target CR for ${creatureType}: ${crResult.finalCR} (base: ${crResult.targetCR}, modifier: ${crResult.modifier})`);
                
                // Get variant template
                const variant = template.variants[creatureType];
                
                // Generate and apply stats
                const scaledStats = StatsGenerator.generateStats(variant.stats, crResult.finalCR);
                await this.applyStats(actor, scaledStats);
                
                // Generate equipment
                await EquipmentGenerator.generateEquipment(variant.equipment, actor);
                
                // Generate features
                await FeaturesGenerator.generateFeatures(variant.features, crResult.finalCR, creatureType, actor);
                
                // Generate spells if template has them
                if (variant.spells) {
                    await SpellsGenerator.generateSpells(variant.spells, crResult.finalCR, creatureType, actor);
                }
                
                // Finalize CR
                await this.finalizeCR(actor, crResult.finalCR);
                
                console.log(`FFTweaks | Successfully enhanced ${creatureType} ${actor.name} (CR ${crResult.finalCR})`);
                return actor;
                
            } catch (error) {
                console.error("FFTweaks | Error enhancing existing actor:", error);
                return null;
            }
        }
        
        private static async createActor(name: string, type: string, cr: number): Promise<Actor | null> {
            try {
                const actorData: any = {
                    name: name,
                    type: "npc",
                    system: {
                        details: {
                            type: {
                                value: type,
                                subtype: "",
                                swarm: "",
                                custom: ""
                            },
                            cr: cr,
                            xp: {
                                value: CRCalculator.crToXP(cr)
                            },
                            source: "FFTweaks Creature Generator"
                        },
                        attributes: {
                            hp: {
                                value: 1,
                                max: 1,
                                temp: 0,
                                tempmax: 0
                            },
                            ac: {
                                flat: 10,
                                calc: "default",
                                formula: ""
                            },
                            movement: {
                                walk: 30,
                                burrow: 0,
                                climb: 0,
                                fly: 0,
                                swim: 0,
                                units: "ft",
                                hover: false
                            }
                        },
                        abilities: {
                            str: { value: 10, proficient: 0 },
                            dex: { value: 10, proficient: 0 },
                            con: { value: 10, proficient: 0 },
                            int: { value: 10, proficient: 0 },
                            wis: { value: 10, proficient: 0 },
                            cha: { value: 10, proficient: 0 }
                        }
                    }
                };
                
                const actor = await Actor.create(actorData) as Actor;
                return actor;
                
            } catch (error) {
                console.error("FFTweaks | Error creating actor:", error);
                return null;
            }
        }
        
        private static async applyStats(actor: Actor, stats: CreatureStats): Promise<void> {
            try {
                const conMod = Math.floor((stats.abilities.con - 10) / 2);
                const hitPoints = Math.max(1, (stats.hitDie.faces / 2 + 0.5 + conMod) * stats.hitDie.number);
                
                const updateData: any = {
                    "system.abilities.str.value": stats.abilities.str,
                    "system.abilities.dex.value": stats.abilities.dex,
                    "system.abilities.con.value": stats.abilities.con,
                    "system.abilities.int.value": stats.abilities.int,
                    "system.abilities.wis.value": stats.abilities.wis,
                    "system.abilities.cha.value": stats.abilities.cha,
                    "system.attributes.hp.max": Math.round(hitPoints),
                    "system.attributes.hp.value": Math.round(hitPoints),
                    "system.details.hitDie": `${stats.hitDie.number}d${stats.hitDie.faces}`
                };
                
                // Apply movement speeds
                for (const [speed, value] of Object.entries(stats.speed)) {
                    updateData[`system.attributes.movement.${speed}`] = value;
                }
                
                // Apply senses
                for (const [sense, value] of Object.entries(stats.senses)) {
                    updateData[`system.attributes.senses.${sense}`] = value;
                }
                
                // Apply skills with proficiency
                for (const [skill, value] of Object.entries(stats.skills)) {
                    updateData[`system.skills.${skill}.proficient`] = 1;
                    updateData[`system.skills.${skill}.value`] = value;
                }
                
                // Apply saves with proficiency
                for (const [save, value] of Object.entries(stats.saves)) {
                    updateData[`system.abilities.${save}.proficient`] = 1;
                    updateData[`system.abilities.${save}.save`] = value;
                }
                
                // Apply damage resistances, immunities, etc.
                updateData["system.traits.dr.value"] = stats.resistances;
                updateData["system.traits.di.value"] = stats.immunities;
                updateData["system.traits.dv.value"] = stats.vulnerabilities;
                updateData["system.traits.ci.value"] = stats.conditionImmunities;
                updateData["system.details.languages.value"] = stats.languages;
                
                await actor.update(updateData);
                
            } catch (error) {
                console.error("FFTweaks | Error applying stats:", error);
            }
        }
        
        private static async finalizeCR(actor: Actor, targetCR: number): Promise<void> {
            try {
                const updateData: any = {
                    "system.details.cr": targetCR,
                    "system.details.xp.value": CRCalculator.crToXP(targetCR)
                };
                
                await actor.update(updateData);
                
                console.log(`FFTweaks | Finalized ${actor.name} at CR ${targetCR} (${CRCalculator.crToXP(targetCR)} XP)`);
                
            } catch (error) {
                console.error("FFTweaks | Error finalizing CR:", error);
            }
        }
        
        private static getAveragePartyLevel(): number {
            const characters = game.actors?.filter((a: any) => a.type === "character" && a.hasPlayerOwner) || [];
            if (characters.length === 0) return 1;
            
            const totalLevel = characters.reduce((sum: number, char: any) => {
                return sum + (char.system?.details?.level || 1);
            }, 0);
            
            return Math.max(1, Math.round(totalLevel / characters.length));
        }
        
        private static getPartySize(): number {
            const characters = game.actors?.filter((a: any) => a.type === "character" && a.hasPlayerOwner) || [];
            return Math.max(1, characters.length);
        }
        
        static getAvailableTemplates(): string[] {
            return Array.from(this.templates.keys());
        }
        
        static async reloadTemplates(): Promise<void> {
            this.templates.clear();
            this.initialized = false;
            await this.initialize();
        }
    }
}
