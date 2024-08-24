export class BattleMap {
    constructor(backgroundImage, gridSize = { x: 10, y: 10 }, padding = 0) {
        this.gridSize = gridSize;
        this.padding = padding;
        this.backgroundImage = backgroundImage;
    }
}

