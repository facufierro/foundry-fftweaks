namespace FFT {
    export class Functions {
        static healSelected = healSelected;
        static hurtSelected = hurtSelected;
        static restSelected = restSelected;
        static toggleCombat = toggleCombat;
        static distributeGold = distributeGold;
        static distributeExperience = distributeExperience;
        static createDefaultLevels = createDefaultLevels;
        static lootCorpses = lootCorpses;
        static generateEquipment = (actorName?: string) => EquipmentGenerator.generateEquipment(actorName);

        // classes
        static runicInscription = runicInscription;
    }
}
