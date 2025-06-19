namespace FFT {
    export type CreatureType = "minion" | "standard" | "elite" | "boss";
    
    export type EncounterDifficulty = "easy" | "medium" | "hard" | "deadly";
    
    export interface CreatureStats {
        abilities: {
            str: number;
            dex: number;
            con: number;
            int: number;
            wis: number;
            cha: number;
        };
        hitDie: {
            faces: number;
            number: number;
        };
        skills: Record<string, number>;
        saves: Record<string, number>;
        speed: Record<string, number>;
        senses: Record<string, number>;
        languages: string[];
        resistances: string[];
        immunities: string[];
        vulnerabilities: string[];
        conditionImmunities: string[];
    }
    
    export interface Equipment {
        weaponSets: Array<{
            chance: number;
            items: Array<{
                name: string;
                quantity: number;
                slot: "primary" | "secondary" | "none";
            }>;
        }>;
        altWeaponSets: Array<{
            chance: number;
            items: Array<{
                name: string;
                quantity: number;
                slot: "primary" | "secondary" | "none";
            }>;
        }>;
        thirdWeaponSets: Array<{
            chance: number;
            items: Array<{
                name: string;
                quantity: number;
                slot: "primary" | "secondary" | "none";
            }>;
        }>;
        armor: Array<{
            name: string;
            chance: number;
        }>;
        gear: Array<{
            name: string;
            chance: number;
        }>;
    }
    
    export interface Feature {
        name: string;
        description: string;
        minCR: number;
        chance: number;
        guaranteed?: boolean;
    }
    
    export interface Spell {
        cantrips: Array<{
            name: string;
            chance: number;
        }>;
        levels: Record<number, Array<{
            name: string;
            chance: number;
        }>>;
        spellcastingAbility: string;
        spellSaveDC?: number;
        spellAttackBonus?: number;
    }
    
    export interface CreatureVariant {
        stats: CreatureStats;
        equipment: Equipment;
        features: Feature[];
        spells?: Spell;
    }
    
    export interface CreatureTemplate {
        name: string;
        type: string;
        variants: {
            minion: CreatureVariant;
            standard: CreatureVariant;
            elite: CreatureVariant;
            boss: CreatureVariant;
        };
    }
    
    export interface GenerationOptions {
        partyLevel?: number;
        partySize?: number;
        difficulty?: EncounterDifficulty;
        templateName?: string;
        creatureType?: CreatureType;
    }
    
    export interface CRCalculationResult {
        targetCR: number;
        modifier: number;
        finalCR: number;
    }
}
