namespace FFT {
    export enum CreatureType {
        MINION = "minion",
        STANDARD = "standard", 
        ELITE = "elite",
        BOSS = "boss"
    }

    export interface CreatureStats {
        abilities?: {
            str?: number;
            dex?: number;
            con?: number;
            int?: number;
            wis?: number;
            cha?: number;
        };
        skills?: Record<string, number>;
        saves?: Record<string, number>;
        ac?: number;
        hp?: {
            formula?: string;
            average?: number;
        };
        speed?: Record<string, number>;
        senses?: Record<string, number>;
        languages?: string[];
        damageResistances?: string[];
        damageImmunities?: string[];
        damageVulnerabilities?: string[];
        conditionImmunities?: string[];
    }

    export interface EquipmentItem {
        name: string;
        quantity?: number;
        equipped?: boolean;
        chance?: number;
        items?: EquipmentItem[]; // For weapon sets
    }

    export interface EquipmentTemplate {
        weaponSets?: EquipmentItem[];
        rangedSets?: EquipmentItem[];
        armor?: EquipmentItem[];
        gear?: EquipmentItem[];
    }

    export interface FeatureItem {
        name: string;
        chance?: number;
        requiresCR?: number; // Minimum CR required
    }

    export interface SpellItem {
        name: string;
        level: number;
        chance?: number;
        requiresCR?: number; // Minimum CR required
        prepared?: boolean;
    }

    export interface SpellTemplate {
        spellcastingAbility?: string;
        spellSaveDC?: number;
        spellAttackBonus?: number;
        cantrips?: SpellItem[];
        spells?: Record<string, SpellItem[]>; // Keyed by spell level
    }

    export interface CreatureTemplate {
        name: string;
        description: string;
        type: CreatureType;
        baseCR: number; // Base CR for standard encounters
        stats?: CreatureStats;
        equipment?: EquipmentTemplate;
        features?: FeatureItem[];
        spells?: SpellTemplate;
    }

    export interface PartyInfo {
        averageLevel: number;
        size: number;
        calculatedCR: number;
    }
}
