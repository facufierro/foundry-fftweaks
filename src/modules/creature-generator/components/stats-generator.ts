namespace FFT {
    export class StatsGenerator {
        // Base ability scores by CR
        private static readonly CR_ABILITY_SCORES = {
            0: { primary: 13, secondary: 12, tertiary: 10 },
            0.125: { primary: 13, secondary: 12, tertiary: 10 },
            0.25: { primary: 14, secondary: 12, tertiary: 10 },
            0.5: { primary: 15, secondary: 13, tertiary: 10 },
            1: { primary: 15, secondary: 13, tertiary: 12 },
            2: { primary: 16, secondary: 14, tertiary: 12 },
            3: { primary: 16, secondary: 14, tertiary: 13 },
            4: { primary: 17, secondary: 15, tertiary: 13 },
            5: { primary: 18, secondary: 15, tertiary: 13 },
            6: { primary: 18, secondary: 16, tertiary: 14 },
            7: { primary: 18, secondary: 16, tertiary: 14 },
            8: { primary: 19, secondary: 16, tertiary: 14 },
            9: { primary: 19, secondary: 17, tertiary: 15 },
            10: { primary: 20, secondary: 17, tertiary: 15 },
            11: { primary: 20, secondary: 18, tertiary: 16 },
            12: { primary: 21, secondary: 18, tertiary: 16 },
            13: { primary: 21, secondary: 18, tertiary: 16 },
            14: { primary: 22, secondary: 19, tertiary: 17 },
            15: { primary: 22, secondary: 19, tertiary: 17 },
            16: { primary: 23, secondary: 20, tertiary: 18 },
            17: { primary: 24, secondary: 20, tertiary: 18 },
            18: { primary: 24, secondary: 21, tertiary: 19 },
            19: { primary: 25, secondary: 21, tertiary: 19 },
            20: { primary: 26, secondary: 22, tertiary: 20 },
            21: { primary: 27, secondary: 22, tertiary: 20 },
            22: { primary: 27, secondary: 23, tertiary: 21 },
            23: { primary: 28, secondary: 23, tertiary: 21 },
            24: { primary: 29, secondary: 24, tertiary: 22 },
            25: { primary: 30, secondary: 24, tertiary: 22 },
            26: { primary: 30, secondary: 25, tertiary: 23 },
            27: { primary: 30, secondary: 25, tertiary: 23 },
            28: { primary: 30, secondary: 26, tertiary: 24 },
            29: { primary: 30, secondary: 26, tertiary: 24 },
            30: { primary: 30, secondary: 27, tertiary: 25 }
        };
        
        // Proficiency bonus by CR
        private static readonly CR_PROFICIENCY_BONUS = {
            0: 2, 0.125: 2, 0.25: 2, 0.5: 2,
            1: 2, 2: 2, 3: 2, 4: 2,
            5: 3, 6: 3, 7: 3, 8: 3,
            9: 4, 10: 4, 11: 4, 12: 4,
            13: 5, 14: 5, 15: 5, 16: 5,
            17: 6, 18: 6, 19: 6, 20: 6,
            21: 7, 22: 7, 23: 7, 24: 7,
            25: 8, 26: 8, 27: 8, 28: 8,
            29: 9, 30: 9
        };
        
        static generateStats(templateStats: CreatureStats, targetCR: number): CreatureStats {
            const crScores = this.CR_ABILITY_SCORES[targetCR] || this.CR_ABILITY_SCORES[Math.floor(targetCR)];
            const profBonus = this.CR_PROFICIENCY_BONUS[targetCR] || this.CR_PROFICIENCY_BONUS[Math.floor(targetCR)];
            
            // Scale ability scores based on CR
            const scaledAbilities = this.scaleAbilities(templateStats.abilities, crScores, targetCR);
            
            // Calculate HP based on hit die and CON modifier
            const conMod = Math.floor((scaledAbilities.con - 10) / 2);
            const avgHP = (templateStats.hitDie.faces / 2 + 0.5 + conMod) * templateStats.hitDie.number;
            
            // Scale skills and saves with proficiency bonus
            const scaledSkills = this.scaleSkills(templateStats.skills, scaledAbilities, profBonus);
            const scaledSaves = this.scaleSaves(templateStats.saves, scaledAbilities, profBonus);
            
            return {
                abilities: scaledAbilities,
                hitDie: {
                    faces: templateStats.hitDie.faces,
                    number: Math.max(1, Math.round(avgHP / (templateStats.hitDie.faces / 2 + 0.5 + conMod)))
                },
                skills: scaledSkills,
                saves: scaledSaves,
                speed: { ...templateStats.speed },
                senses: { ...templateStats.senses },
                languages: [...templateStats.languages],
                resistances: [...templateStats.resistances],
                immunities: [...templateStats.immunities],
                vulnerabilities: [...templateStats.vulnerabilities],
                conditionImmunities: [...templateStats.conditionImmunities]
            };
        }
        
        private static scaleAbilities(
            templateAbilities: CreatureStats['abilities'], 
            crScores: { primary: number; secondary: number; tertiary: number },
            targetCR: number
        ): CreatureStats['abilities'] {
            // Determine which abilities are primary, secondary, tertiary based on template values
            const abilityEntries = Object.entries(templateAbilities).sort((a, b) => b[1] - a[1]);
            
            const result = { ...templateAbilities };
            
            // Assign scaled scores based on ranking in template
            if (abilityEntries.length >= 1) {
                result[abilityEntries[0][0] as keyof CreatureStats['abilities']] = crScores.primary;
            }
            if (abilityEntries.length >= 2) {
                result[abilityEntries[1][0] as keyof CreatureStats['abilities']] = crScores.secondary;
            }
            if (abilityEntries.length >= 3) {
                result[abilityEntries[2][0] as keyof CreatureStats['abilities']] = crScores.tertiary;
            }
            
            // Scale remaining abilities proportionally
            for (let i = 3; i < abilityEntries.length; i++) {
                const [ability, originalValue] = abilityEntries[i];
                const scaleFactor = targetCR >= 1 ? 1 + (targetCR - 1) * 0.1 : 1;
                result[ability as keyof CreatureStats['abilities']] = Math.max(8, Math.min(30, Math.round(originalValue * scaleFactor)));
            }
            
            return result;
        }
        
        private static scaleSkills(
            templateSkills: Record<string, number>,
            abilities: CreatureStats['abilities'],
            profBonus: number
        ): Record<string, number> {
            const skillAbilityMap: Record<string, keyof CreatureStats['abilities']> = {
                'acr': 'dex', 'ani': 'wis', 'arc': 'int', 'ath': 'str',
                'dec': 'cha', 'his': 'int', 'ins': 'wis', 'itm': 'cha',
                'inv': 'int', 'med': 'wis', 'nat': 'int', 'prc': 'wis',
                'prf': 'cha', 'per': 'cha', 'rel': 'int', 'slt': 'dex',
                'ste': 'dex', 'sur': 'wis'
            };
            
            const result: Record<string, number> = {};
            
            for (const [skill, bonus] of Object.entries(templateSkills)) {
                const ability = skillAbilityMap[skill] || 'wis';
                const abilityMod = Math.floor((abilities[ability] - 10) / 2);
                
                // If template has proficiency, apply scaled proficiency bonus
                if (bonus > abilityMod) {
                    result[skill] = abilityMod + profBonus;
                } else {
                    result[skill] = abilityMod;
                }
            }
            
            return result;
        }
        
        private static scaleSaves(
            templateSaves: Record<string, number>,
            abilities: CreatureStats['abilities'],
            profBonus: number
        ): Record<string, number> {
            const saveAbilityMap: Record<string, keyof CreatureStats['abilities']> = {
                'str': 'str', 'dex': 'dex', 'con': 'con',
                'int': 'int', 'wis': 'wis', 'cha': 'cha'
            };
            
            const result: Record<string, number> = {};
            
            for (const [save, bonus] of Object.entries(templateSaves)) {
                const ability = saveAbilityMap[save] || save as keyof CreatureStats['abilities'];
                const abilityMod = Math.floor((abilities[ability] - 10) / 2);
                
                // If template has proficiency, apply scaled proficiency bonus
                if (bonus > abilityMod) {
                    result[save] = abilityMod + profBonus;
                } else {
                    result[save] = abilityMod;
                }
            }
            
            return result;
        }
        
        static getProficiencyBonus(cr: number): number {
            return this.CR_PROFICIENCY_BONUS[cr] || this.CR_PROFICIENCY_BONUS[Math.floor(cr)] || 2;
        }
    }
}
