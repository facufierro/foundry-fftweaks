namespace FFT {
    export class Functions {
        // Core functions
        static selectAllPlayers = selectAllPlayers;
        static distributeGold = distributeGold;
        static distributeExperience = distributeExperience;
        static createDefaultLevels = createDefaultLevels;
        static lootCorpses = lootCorpses;
        static generateEquipment = (actorName?: string) => {
            console.warn("FFTweaks | generateEquipment function requires an actor parameter. Use FFT.CreatureGenerator API instead.");
        };

        // Parameterized functions for more flexibility
        static healTokens = healTokens;
        static hurtTokens = hurtTokens;
        static restTokens = restTokens;

        // Individual combat functions
        static addTokensToCombat = addTokensToCombat;
        static removeTokensFromCombat = removeTokensFromCombat;
        static resetCombatEncounter = resetCombatEncounter;
        static deleteCombatEncounter = deleteCombatEncounter;

        // classes
        static runicInscription = runicInscription;
    }
}
