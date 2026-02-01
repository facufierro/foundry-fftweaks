import { resourceful } from './features/species/human/resourceful';
import { beguilingMagic } from './features/classes/bard/beguiling-magic';
import { jackOfAllTrades } from './features/classes/bard/jack-of-all-trades';

export class Automations {
    static initialize() {
        resourceful();
        beguilingMagic();
        jackOfAllTrades();
    }
}

