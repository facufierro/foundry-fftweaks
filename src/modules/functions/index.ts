import { healSelected } from "./data/heal-selected";
import { hurtSelected } from "./data/hurt-selected";
import { restSelected } from "./data/rest-selected";
import { createDefaultLevels } from "./data/create-default-levels";
import { toggleCombat } from "./data/toggle-combat";



export namespace FFT {
    export class Functions {
        static healSelected = healSelected;
        static hurtSelected = hurtSelected;
        static restSelected = restSelected;
        static toggleCombat = toggleCombat;
        static createDefaultLevels = createDefaultLevels;
    }
}
