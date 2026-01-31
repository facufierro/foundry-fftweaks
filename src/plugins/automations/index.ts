import { resourceful } from './features/species/human/resourceful';
import { beguilingMagic } from './features/classes/bard/beguiling-magic';

export class Automations {
    static initialize() {
        console.log("FFTweaks | Automations Initializing...");
        resourceful();
        beguilingMagic();
    }
}

