import { resourceful } from './species/human/resourceful';
import { beguilingMagic } from './classes/bard/beguiling-magic';
import { jackOfAllTrades } from './classes/bard/jack-of-all-trades';
import { lucky } from './classes/feats/origin/lucky';
import { advancementLinker } from './utilities/update-advancements';

export class Automations {
    static initialize() {
        resourceful();
        beguilingMagic();
        jackOfAllTrades();
        lucky();
        advancementLinker();
    }
}

