import { Battlemap } from './Battlemap.js';

export class Forestmap extends Battlemap {
    constructor(uuid, name, treeDensity) {
        super(uuid, name);
        this.treeDensity = treeDensity;
    }
}
