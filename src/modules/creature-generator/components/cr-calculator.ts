namespace FFT {
    export class CRCalculator {
        private static readonly CR_ADJUSTMENTS = {
            [CreatureType.MINION]: -2,
            [CreatureType.STANDARD]: 0,
            [CreatureType.ELITE]: +1,
            [CreatureType.BOSS]: +2
        };

        static calculatePartyCR(): PartyInfo {
            const playerActors = game.actors?.filter(actor => 
                actor.type === "character" && actor.hasPlayerOwner
            ) || [];

            if (playerActors.length === 0) {
                console.warn("CRCalculator: No player characters found");
                return {
                    averageLevel: 1,
                    size: 4,
                    calculatedCR: 1
                };
            }

            const totalLevel = playerActors.reduce((sum, actor) => {
                const level = (actor.system as any)?.details?.level || 1;
                return sum + level;
            }, 0);

            const averageLevel = Math.round(totalLevel / playerActors.length);
            const partySize = playerActors.length;

            // Calculate base CR using average level (more conservative scaling)
            let baseCR = Math.max(0.125, Math.round(averageLevel * 0.75));
            
            // Adjust for party size (standard is 4 players)
            if (partySize < 4) {
                baseCR = Math.max(0.125, baseCR - 1);
            } else if (partySize > 4) {
                baseCR += Math.floor((partySize - 4) / 3); // More conservative party size scaling
            }

            console.log(`CRCalculator: Party - Average Level: ${averageLevel}, Size: ${partySize}, Base CR: ${baseCR}`);

            return {
                averageLevel,
                size: partySize,
                calculatedCR: baseCR
            };
        }

        static getTargetCR(creatureType: CreatureType, baseCR?: number): number {
            const partyInfo = this.calculatePartyCR();
            const adjustment = this.CR_ADJUSTMENTS[creatureType] || 0;
            
            // Use the party's calculated CR as the base, not the template's baseCR
            const targetCR = Math.max(0.125, partyInfo.calculatedCR + adjustment);
            
            console.log(`CRCalculator: Party CR: ${partyInfo.calculatedCR}, Type: ${creatureType}, Adjustment: ${adjustment}, Final CR: ${targetCR}`);
            
            return targetCR;
        }

        static getCRMultiplier(targetCR: number, baseCR: number): number {
            // Returns a multiplier for scaling stats based on CR difference
            if (baseCR === 0 || targetCR === baseCR) return 1;
            
            const crDifference = targetCR - baseCR;
            
            // Much more conservative scaling - each CR represents roughly 1.15x power increase/decrease
            // Cap the multiplier to prevent extreme scaling
            const multiplier = Math.pow(1.15, crDifference);
            return Math.max(0.5, Math.min(3.0, multiplier)); // Cap between 0.5x and 3x
        }

        static scaleStat(baseStat: number, multiplier: number, isHP: boolean = false): number {
            if (isHP) {
                // HP scales more aggressively but still conservative
                return Math.round(baseStat * Math.pow(multiplier, 0.8));
            } else {
                // Other stats scale very conservatively
                return Math.round(baseStat * Math.pow(multiplier, 0.3));
            }
        }

        static getProficiencyBonus(cr: number): number {
            if (cr <= 4) return 2;
            if (cr <= 8) return 3;
            if (cr <= 12) return 4;
            if (cr <= 16) return 5;
            if (cr <= 20) return 6;
            if (cr <= 24) return 7;
            if (cr <= 28) return 8;
            return 9;
        }

        static getSpellSlots(cr: number, spellLevel: number): number {
            // Simplified spell slot calculation based on CR
            const casterLevel = Math.min(20, Math.max(1, Math.round(cr * 2)));
            
            // Basic spell slot progression (simplified)
            const slotTable: Record<number, number[]> = {
                1: [2],
                2: [3],
                3: [4, 2],
                4: [4, 3],
                5: [4, 3, 2],
                6: [4, 3, 3],
                7: [4, 3, 3, 1],
                8: [4, 3, 3, 2],
                9: [4, 3, 3, 3, 1],
                10: [4, 3, 3, 3, 2],
                11: [4, 3, 3, 3, 2, 1],
                12: [4, 3, 3, 3, 2, 1],
                13: [4, 3, 3, 3, 2, 1, 1],
                14: [4, 3, 3, 3, 2, 1, 1],
                15: [4, 3, 3, 3, 2, 1, 1, 1],
                16: [4, 3, 3, 3, 2, 1, 1, 1],
                17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
                18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
                19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
                20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
            };

            const levelSlots = slotTable[Math.min(20, casterLevel)] || [2];
            return levelSlots[spellLevel - 1] || 0;
        }
    }
}
