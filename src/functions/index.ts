namespace FFT {
    export class Functions {
        static healSelected = healSelected;
        static hurtSelected = hurtSelected;
        static restSelected = restSelected;
        static selectAllPlayers = selectAllPlayers;
        static toggleCombat = toggleCombat;
        static resetCombat = resetCombat;
        static distributeGold = distributeGold;
        static distributeExperience = distributeExperience;
        static createDefaultLevels = createDefaultLevels;
        static lootCorpses = lootCorpses;
        static generateEquipment = (actorName?: string) => {
            console.warn("FFTweaks | generateEquipment function requires an actor parameter. Use FFT.CreatureGenerator API instead.");
        };

        // classes
        static runicInscription = runicInscription;
    }
}
