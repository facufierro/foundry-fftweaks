import { resourceful } from './features/species/human/resourceful';
import { beguilingMagic } from './features/classes/bard/beguiling-magic';

export class Automations {
    static initialize() {
        resourceful();
        beguilingMagic();
    }
}

