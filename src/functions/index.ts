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

        // Individual heal functions
        static fullHealSelected = fullHealSelected;
        static heal1Selected = heal1Selected;
        static heal5Selected = heal5Selected;
        static heal10Selected = heal10Selected;

        // Individual hurt functions
        static killSelected = killSelected;
        static hurt1Selected = hurt1Selected;
        static hurt5Selected = hurt5Selected;
        static hurt10Selected = hurt10Selected;

        // Individual rest functions
        static longRestSelected = longRestSelected;
        static shortRestSelected = shortRestSelected;

        // Individual combat functions
        static addTokensToCombat = addTokensToCombat;
        static removeTokensFromCombat = removeTokensFromCombat;
        static resetCombatEncounter = resetCombatEncounter;
        static deleteCombatEncounter = deleteCombatEncounter;

        // Parameterized functions for more flexibility
        static healTokens = healTokens;
        static hurtTokens = hurtTokens;
        static restTokens = restTokens;

        // classes
        static runicInscription = runicInscription;
    }
}
