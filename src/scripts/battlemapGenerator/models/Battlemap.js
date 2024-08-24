export class Battlemap {
    constructor(uuid, name) {
        this.uuid = uuid;
        this.name = name;
        this.gridSize = { x: 10, y: 10 };
        this.padding = 0;
    }
}

