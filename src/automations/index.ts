import { resourceful } from './species/human/resourceful';
import { Artificer } from './classes/artificer';
import { Barbarian } from './classes/barbarian';
import { Bard } from './classes/bard';
import { Runesmith } from './subclasses/artificer/runesmith';
import { PathOfTheBerserker } from './subclasses/barbarian/path-of-the-berserker';
import { CollegeOfGlamour } from './subclasses/bard/college-of-glamour';
import { PreparedSpellsAutomation } from './system/prepared-spells';
import { ActionsAutomation } from './system/actions';
import { RestAutomation } from './system/rest';
import { lucky } from './feats/origin/lucky';
import { advancementLinker } from './utilities/update-advancements';

export class Automations {
    static initialize() {
        // Artificer
        Artificer.initialize();
        Runesmith.initialize();
        // Barbarian
        Barbarian.initialize();
        PathOfTheBerserker.initialize();
        // Bard
        Bard.initialize();
        CollegeOfGlamour.initialize();
        // System
        RestAutomation.initialize();
        ActionsAutomation.initialize();
        PreparedSpellsAutomation.initialize();

        resourceful();
        lucky();
        advancementLinker();
    }
}

