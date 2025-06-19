namespace FFT {
    export class CRCalculator {
        // XP thresholds per character level for encounter difficulties
        private static readonly XP_THRESHOLDS = [
            [25, 50, 75, 100],      // Level 1
            [50, 100, 150, 200],    // Level 2
            [75, 150, 225, 300],    // Level 3
            [125, 250, 375, 500],   // Level 4
            [250, 500, 750, 1100],  // Level 5
            [300, 600, 900, 1400],  // Level 6
            [350, 750, 1100, 1700], // Level 7
            [450, 900, 1400, 2100], // Level 8
            [550, 1100, 1600, 2400], // Level 9
            [600, 1200, 1900, 2800], // Level 10
            [800, 1600, 2400, 3600], // Level 11
            [1000, 2000, 3000, 4500], // Level 12
            [1100, 2200, 3400, 5100], // Level 13
            [1250, 2500, 3800, 5700], // Level 14
            [1400, 2800, 4300, 6400], // Level 15
            [1600, 3200, 4800, 7200], // Level 16
            [2000, 3900, 5900, 8800], // Level 17
            [2100, 4200, 6300, 9500], // Level 18
            [2400, 4900, 7300, 10900], // Level 19
            [2800, 5700, 8500, 12700]  // Level 20
        ];
        
        // XP values by CR
        private static readonly CR_XP = {
            0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
            1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
            6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
            11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
            16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
            21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
            26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000
        };
        
        static calculateTargetCR(
            partyLevel: number = 1,
            partySize: number = 4,
            difficulty: EncounterDifficulty = "medium",
            creatureType: CreatureType = "standard"
        ): CRCalculationResult {
            // Clamp party level to valid range
            const level = Math.max(1, Math.min(20, partyLevel));
            
            // Get difficulty index
            const difficultyIndex = ["easy", "medium", "hard", "deadly"].indexOf(difficulty);
            
            // Calculate target XP budget
            const baseXP = this.XP_THRESHOLDS[level - 1][difficultyIndex];
            const totalXP = baseXP * partySize;
            
            // Apply creature type modifier
            const modifier = this.getCreatureTypeModifier(creatureType);
            
            // Find closest CR for the XP budget
            let targetCR = this.xpToCR(totalXP);
            const finalCR = Math.max(0, targetCR + modifier);
            
            return {
                targetCR,
                modifier,
                finalCR
            };
        }
        
        private static getCreatureTypeModifier(creatureType: CreatureType): number {
            switch (creatureType) {
                case "minion": return -1;
                case "standard": return 0;
                case "elite": return 1;
                case "boss": return 2;
                default: return 0;
            }
        }
        
        private static xpToCR(xp: number): number {
            let closestCR = 0;
            let closestDiff = Math.abs(this.CR_XP[0] - xp);
            
            for (const [cr, crXP] of Object.entries(this.CR_XP)) {
                const diff = Math.abs(crXP - xp);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestCR = parseFloat(cr);
                }
            }
            
            return closestCR;
        }
        
        static crToXP(cr: number): number {
            return this.CR_XP[cr] || 0;
        }
        
        static getNextCR(currentCR: number): number {
            const crs = Object.keys(this.CR_XP).map(cr => parseFloat(cr)).sort((a, b) => a - b);
            const currentIndex = crs.indexOf(currentCR);
            return currentIndex >= 0 && currentIndex < crs.length - 1 ? crs[currentIndex + 1] : currentCR;
        }
        
        static getPreviousCR(currentCR: number): number {
            const crs = Object.keys(this.CR_XP).map(cr => parseFloat(cr)).sort((a, b) => a - b);
            const currentIndex = crs.indexOf(currentCR);
            return currentIndex > 0 ? crs[currentIndex - 1] : currentCR;
        }
    }
}
