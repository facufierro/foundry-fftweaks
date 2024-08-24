import { BattleMap } from './BattleMap.js';

export class ForestMap extends BattleMap {
    constructor(backgroundImage, gridSize = { x: 10, y: 10 }, padding = 0, treeDensity = 0.5) {
        super(backgroundImage, gridSize, padding);
        this.treeDensity = treeDensity
    }

    generate() {
        ui.notifications.info(`Generating forest map with tree density of ${this.treeDensity} background image: ${this.backgroundImage}`);
    }
}
