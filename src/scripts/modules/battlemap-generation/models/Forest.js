export class Forest {
    constructor({ trees = [], bushes = [], rocks = [], encounters = [], backgrounds = [] } = {}) {
        this.trees = trees;
        this.bushes = bushes;
        this.rocks = rocks;
        this.encounters = encounters;
        this.backgrounds = backgrounds;
    }

    static async createFromPreset() {
        const presetData = await dataManager.initializeData();
        const forestData = presetData.forest;

        return new Forest({
            trees: forestData.trees,
            bushes: forestData.bushes,
            rocks: forestData.rocks,
            encounters: forestData.encounters,
            backgrounds: forestData.backgrounds
        });
    }

    async spawnTrees(treeNumber = 20) {
        await spawnRandomPreset(this.trees, canvas.dimensions, 0, treeNumber);
    }
}
