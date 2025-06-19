namespace FFT {
    export class SpellsGenerator {
        static async generateSpells(
            templateSpells: Spell | undefined, 
            targetCR: number, 
            creatureType: CreatureType,
            actor: Actor
        ): Promise<void> {
            if (!templateSpells) {
                console.log(`FFTweaks | No spells template provided for ${actor.name}`);
                return;
            }
            
            try {
                const selectedSpells: Item[] = [];
                const maxSpellLevel = this.getMaxSpellLevel(targetCR);
                
                // Generate cantrips
                if (templateSpells.cantrips && templateSpells.cantrips.length > 0) {
                    for (const cantrip of templateSpells.cantrips) {
                        if (Math.random() * 100 < cantrip.chance) {
                            const spell = await this.findSpellByName(cantrip.name);
                            if (spell) selectedSpells.push(spell);
                        }
                    }
                }
                
                // Generate leveled spells
                if (templateSpells.levels) {
                    for (const [levelStr, spells] of Object.entries(templateSpells.levels)) {
                        const level = parseInt(levelStr);
                        if (level <= maxSpellLevel) {
                            const spellsForLevel = this.selectSpellsForLevel(spells, creatureType, level);
                            for (const spellName of spellsForLevel) {
                                const spell = await this.findSpellByName(spellName);
                                if (spell) selectedSpells.push(spell);
                            }
                        }
                    }
                }
                
                if (selectedSpells.length > 0) {
                    // Add spells to actor
                    await actor.createEmbeddedDocuments("Item", selectedSpells.map(spell => spell.toObject()));
                    
                    // Update spellcasting ability if needed
                    await this.updateSpellcastingAbility(actor, templateSpells);
                    
                    console.log(`FFTweaks | Applied ${selectedSpells.length} spells to ${actor.name}: ${selectedSpells.map(s => s.name).join(', ')}`);
                }
                
            } catch (error) {
                console.error("FFTweaks | Error generating spells:", error);
            }
        }
        
        private static getMaxSpellLevel(cr: number): number {
            if (cr < 1) return 0;
            if (cr < 3) return 1;
            if (cr < 5) return 2;
            if (cr < 7) return 3;
            if (cr < 9) return 4;
            if (cr < 11) return 5;
            if (cr < 13) return 6;
            if (cr < 15) return 7;
            if (cr < 17) return 8;
            return 9;
        }
        
        private static selectSpellsForLevel(
            spells: Array<{ name: string; chance: number }>,
            creatureType: CreatureType,
            spellLevel: number
        ): string[] {
            const maxSpells = this.getMaxSpellsForLevel(creatureType, spellLevel);
            const selectedSpells: string[] = [];
            
            // Sort spells by chance (highest first) to prioritize important spells
            const sortedSpells = [...spells].sort((a, b) => b.chance - a.chance);
            
            for (const spell of sortedSpells) {
                if (selectedSpells.length >= maxSpells) break;
                
                if (Math.random() * 100 < spell.chance) {
                    selectedSpells.push(spell.name);
                }
            }
            
            return selectedSpells;
        }
        
        private static getMaxSpellsForLevel(creatureType: CreatureType, spellLevel: number): number {
            const baseLimit = spellLevel <= 3 ? 3 : spellLevel <= 6 ? 2 : 1;
            
            switch (creatureType) {
                case "minion": return Math.max(1, Math.floor(baseLimit * 0.5));
                case "standard": return baseLimit;
                case "elite": return Math.floor(baseLimit * 1.5);
                case "boss": return baseLimit * 2;
                default: return baseLimit;
            }
        }
        
        private static async findSpellByName(spellName: string): Promise<Item | null> {
            try {
                // Search in world items first
                let spell = game.items?.find((i: any) => 
                    i.name?.toLowerCase() === spellName.toLowerCase() && i.type === "spell"
                );
                if (spell) return spell;
                
                // Search in compendiums
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item") {
                        await pack.getIndex();
                        const entry = pack.index.find((i: any) => i.name?.toLowerCase() === spellName.toLowerCase());
                        if (entry) {
                            const item = await pack.getDocument(entry._id!);
                            if (item && (item as Item).type === "spell") {
                                return item as Item;
                            }
                        }
                    }
                }
                
                console.warn(`FFTweaks | Spell not found: ${spellName}`);
                return null;
                
            } catch (error) {
                console.error(`FFTweaks | Error finding spell ${spellName}:`, error);
                return null;
            }
        }
        
        private static async updateSpellcastingAbility(actor: Actor, templateSpells: Spell): Promise<void> {
            try {
                const ability = templateSpells.spellcastingAbility.toLowerCase();
                const abilityMod = Math.floor(((actor.system as any).abilities[ability]?.value - 10) / 2);
                const profBonus = StatsGenerator.getProficiencyBonus((actor.system as any).details?.cr || 0);
                
                const spellAttackBonus = templateSpells.spellAttackBonus ?? (abilityMod + profBonus);
                const spellSaveDC = templateSpells.spellSaveDC ?? (8 + abilityMod + profBonus);
                
                const updateData: any = {
                    "system.attributes.spellcasting": ability,
                    "system.attributes.spelldc": spellSaveDC,
                    "system.attributes.spellattack": spellAttackBonus
                };
                
                await actor.update(updateData);
                
                console.log(`FFTweaks | Updated spellcasting for ${actor.name}: ${ability.toUpperCase()} (DC: ${spellSaveDC}, Attack: +${spellAttackBonus})`);
                
            } catch (error) {
                console.error("FFTweaks | Error updating spellcasting ability:", error);
            }
        }
        
        static createSpellSlots(actor: Actor, casterLevel: number, casterType: "full" | "half" | "third" = "full"): void {
            const spellSlots = this.calculateSpellSlots(casterLevel, casterType);
            
            const updateData: any = {};
            for (let level = 1; level <= 9; level++) {
                const slots = spellSlots[level] || 0;
                updateData[`system.spells.spell${level}.max`] = slots;
                updateData[`system.spells.spell${level}.value`] = slots;
            }
            
            actor.update(updateData);
        }
        
        private static calculateSpellSlots(casterLevel: number, casterType: "full" | "half" | "third"): Record<number, number> {
            let effectiveLevel = casterLevel;
            
            if (casterType === "half") {
                effectiveLevel = Math.floor(casterLevel / 2);
            } else if (casterType === "third") {
                effectiveLevel = Math.floor(casterLevel / 3);
            }
            
            // Simplified spell slot progression
            const slots: Record<number, number> = {};
            
            if (effectiveLevel >= 1) slots[1] = Math.min(4, 2 + Math.floor(effectiveLevel / 3));
            if (effectiveLevel >= 3) slots[2] = Math.min(3, 2 + Math.floor((effectiveLevel - 3) / 4));
            if (effectiveLevel >= 5) slots[3] = Math.min(3, 2 + Math.floor((effectiveLevel - 5) / 4));
            if (effectiveLevel >= 7) slots[4] = Math.min(3, 1 + Math.floor((effectiveLevel - 7) / 4));
            if (effectiveLevel >= 9) slots[5] = Math.min(3, 1 + Math.floor((effectiveLevel - 9) / 4));
            if (effectiveLevel >= 11) slots[6] = Math.min(2, 1 + Math.floor((effectiveLevel - 11) / 6));
            if (effectiveLevel >= 13) slots[7] = Math.min(2, 1 + Math.floor((effectiveLevel - 13) / 6));
            if (effectiveLevel >= 15) slots[8] = Math.min(1, Math.floor((effectiveLevel - 15) / 6));
            if (effectiveLevel >= 17) slots[9] = Math.min(1, Math.floor((effectiveLevel - 17) / 6));
            
            return slots;
        }
    }
}
