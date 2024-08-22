
generateForest()

async function setBackgroundImage() {

}
async function generateForest() {
    const TREE_COUNT = 10;
    const TREE_LIST = [
        "WILDERNESS Tree 01",
        "WILDERNESS Tree 02",
        "WILDERNESS Tree 03",
        "WILDERNESS Tree 01 Large",
        "WILDERNESS Tree 02 Large",
        "WILDERNESS Tree 03 Large",
    ];

    for (let i = 0; i < TREE_COUNT; i++) {
        const tree = TREE_LIST[Math.floor(Math.random() * TREE_LIST.length)];
        const x = Math.floor(Math.random() * canvas.scene.dimensions.width);
        const y = Math.floor(Math.random() * canvas.scene.dimensions.height);
        await MassEdit.spawnPreset({ name: tree, x, y });
    }


}

async function spawnEnemies() {

}