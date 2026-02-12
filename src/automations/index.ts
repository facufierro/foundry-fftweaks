import { resourceful } from './species/human/resourceful';
import { Artificer } from './classes/artificer';
import { Barbarian } from './classes/barbarian';
import { Bard } from './classes/bard';
import { Runesmith } from './subclasses/artificer/runesmith';
import { PathOfTheBerserker } from './subclasses/barbarian/path-of-the-berserker';
import { CollegeOfGlamour } from './subclasses/bard/college-of-glamour';
import { ActionsAutomation } from './system/actions';
import { RestAutomation } from './system/rest';
import { lucky } from './feats/origin/lucky';
import { advancementLinker } from './utilities/update-advancements';

export class Automations {
    static initialize() {
        resourceful();
        Artificer.initialize();
        Barbarian.initialize();
        Bard.initialize();
        Runesmith.initialize();
        PathOfTheBerserker.initialize();
        CollegeOfGlamour.initialize();
        ActionsAutomation.initialize();
        RestAutomation.initialize();
        lucky();
        advancementLinker();
    }
}

