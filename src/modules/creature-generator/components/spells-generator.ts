namespace FFT {
    export class SpellsGenerator {
        private static readonly SPELLS_COMPENDIUM_NAME = "fftweaks.spells";

        static async applySpellsToActor(actor: Actor, template: CreatureTemplate): Promise<boolean> {
            if (!actor || !template.spells) {
                return false;
            }

            try {
                const targetCR = CRCalculator.getTargetCR(template.type, template.baseCR);
                
                // Update spellcasting attributes first
                await this.updateSpellcastingAttributes(actor, template.spells, targetCR);

                // Add cantrips
                if (template.spells.cantrips && template.spells.cantrips.length > 0) {
                    const cantripsToAdd = this.rollForSpells(template.spells.cantrips, targetCR);
                    await this.addSpellsToActor(actor, cantripsToAdd);
                }

                // Add spells by level
                if (template.spells.spells) {
                    for (const [level, spells] of Object.entries(template.spells.spells)) {
                        const spellLevel = parseInt(level);
                        const spellsToAdd = this.rollForSpells(spells, targetCR);
                        await this.addSpellsToActor(actor, spellsToAdd, spellLevel);
                    }
                }

                console.log(`SpellsGenerator: Successfully applied spells to ${actor.name}`);
                return true;

            } catch (error) {
                console.error(`SpellsGenerator: Error applying spells to ${actor.name}:`, error);
                return false;
            }
        }

        private static async updateSpellcastingAttributes(actor: Actor, spellTemplate: SpellTemplate, currentCR: number): Promise<void> {
            const updates: any = {};

            // Set spellcasting ability
            if (spellTemplate.spellcastingAbility) {
                updates["system.attributes.spellcasting"] = spellTemplate.spellcastingAbility;
            }

            // Calculate and set spell save DC
            let spellSaveDC = spellTemplate.spellSaveDC;
            if (!spellSaveDC && spellTemplate.spellcastingAbility) {
                const profBonus = CRCalculator.getProficiencyBonus(currentCR);
                const abilityMod = this.getAbilityModifier(actor, spellTemplate.spellcastingAbility);
                spellSaveDC = 8 + profBonus + abilityMod;
            }
            if (spellSaveDC) {
                updates["system.attributes.spelldc"] = spellSaveDC;
            }

            // Calculate and set spell attack bonus
            let spellAttackBonus = spellTemplate.spellAttackBonus;
            if (!spellAttackBonus && spellTemplate.spellcastingAbility) {
                const profBonus = CRCalculator.getProficiencyBonus(currentCR);
                const abilityMod = this.getAbilityModifier(actor, spellTemplate.spellcastingAbility);
                spellAttackBonus = profBonus + abilityMod;
            }
            if (spellAttackBonus) {
                updates["system.bonuses.spell.attack"] = spellAttackBonus.toString();
            }

            // Set spell slots based on CR
            const spellSlots: any = {};
            for (let level = 1; level <= 9; level++) {
                const slots = CRCalculator.getSpellSlots(currentCR, level);
                if (slots > 0) {
                    spellSlots[`spell${level}`] = {
                        value: slots,
                        max: slots
                    };
                }
            }
            if (Object.keys(spellSlots).length > 0) {
                updates["system.spells"] = spellSlots;
            }

            if (Object.keys(updates).length > 0) {
                await actor.update(updates);
            }
        }

        private static getAbilityModifier(actor: Actor, ability: string): number {
            const abilityValue = (actor.system as any)?.abilities?.[ability]?.value || 10;
            return Math.floor((abilityValue - 10) / 2);
        }

        private static rollForSpells(spells: SpellItem[], currentCR: number): SpellItem[] {
            const successfulSpells: SpellItem[] = [];

            for (const spell of spells) {
                // Check CR requirement
                if (spell.requiresCR && currentCR < spell.requiresCR) {
                    continue;
                }

                // Roll for chance
                const chance = spell.chance || 100;
                const roll = Math.random() * 100;
                if (roll <= chance) {
                    successfulSpells.push(spell);
                }
            }

            return successfulSpells;
        }

        private static async addSpellsToActor(actor: Actor, spellItems: SpellItem[], spellLevel?: number): Promise<void> {
            const itemsToCreate: any[] = [];

            for (const spellItem of spellItems) {
                let spellData = await this.findSpellInCompendium(spellItem.name);

                if (!spellData) {
                    spellData = this.createPlaceholderSpell(spellItem.name, spellLevel || 0);
                }

                const itemToAdd = foundry.utils.duplicate(spellData);
                
                // Set preparation status for leveled spells
                if (spellLevel && spellLevel > 0) {
                    itemToAdd.system.preparation = {
                        mode: "prepared",
                        prepared: spellItem.prepared ?? true
                    };
                    itemToAdd.system.level = spellLevel;
                }

                itemsToCreate.push(itemToAdd);
            }

            if (itemsToCreate.length > 0) {
                await actor.createEmbeddedDocuments("Item", itemsToCreate);
            }
        }

        private static async findSpellInCompendium(spellName: string): Promise<any | null> {
            try {
                const compendium = game.packs.get(this.SPELLS_COMPENDIUM_NAME);
                if (!compendium) {
                    console.warn(`SpellsGenerator: Compendium ${this.SPELLS_COMPENDIUM_NAME} not found`);
                    return null;
                }

                const index = await compendium.getIndex();
                const spellEntry = index.find((entry: any) =>
                    entry.name.toLowerCase() === spellName.toLowerCase()
                );

                if (!spellEntry) {
                    return null;
                }

                const spellDocument = await compendium.getDocument(spellEntry._id);
                return spellDocument?.toObject();

            } catch (error) {
                console.warn(`SpellsGenerator: Error searching compendium for ${spellName}:`, error);
                return null;
            }
        }

        private static createPlaceholderSpell(spellName: string, level: number): any {
            return {
                name: spellName,
                type: "spell",
                img: "icons/svg/book.svg",
                system: {
                    description: {
                        value: `<p>Placeholder spell: ${spellName}</p><p><em>This spell was not found in the compendium and needs to be configured manually.</em></p>`
                    },
                    level: level,
                    school: "div",
                    components: {
                        vocal: false,
                        somatic: false,
                        material: false,
                        ritual: false,
                        concentration: false
                    },
                    materials: {
                        value: "",
                        consumed: false,
                        cost: 0,
                        supply: 0
                    },
                    preparation: {
                        mode: level > 0 ? "prepared" : "cantrip",
                        prepared: level > 0
                    },
                    scaling: {
                        mode: "none",
                        formula: ""
                    },
                    properties: [],
                    activation: {
                        type: "action",
                        cost: 1,
                        condition: ""
                    },
                    duration: {
                        value: null,
                        units: "inst"
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
                        units: "touch"
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
                    ability: "",
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
                    }
                }
            };
        }

        static async generateSpells(actorName?: string): Promise<void> {
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

                const success = await this.applySpellsToActor(actor, template);
                if (success) {
                    ui.notifications?.info(`Spells applied to ${actor.name}`);
                } else {
                    ui.notifications?.warn(`Failed to apply spells to ${actor.name}`);
                }
            } catch (error) {
                console.error(`SpellsGenerator: Error in generateSpells:`, error);
                ui.notifications?.error(`Error generating spells: ${error}`);
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
                console.warn(`SpellsGenerator: Could not load template ${templateName}:`, error);
                return null;
            }
        }
    }
}
