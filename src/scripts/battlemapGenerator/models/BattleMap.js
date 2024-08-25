import * as random from '../../utils/random.js';
import * as backgroundManager from '../services/background-manager.js';
import * as presetManager from '../services/preset-manager.js';

export class BattleMap {
    constructor() {
        this.scene = game.scenes.get('4xErahF7PDwMuy2e');
        if (!this.scene) {
            throw new Error("Scene not found");
        }

        this.gridSize = { x: this.scene.grid.size, y: this.scene.grid.size };
        this.padding = this.scene.padding || 0;
        this.backgroundImage = this.scene.background.src;
        this.sceneSize = { width: this.scene.width, height: this.scene.height }; // Make sure scene size is defined
    }

    async initializeData() {
        this.presetData = await (await fetch('modules/fftweaks/src/scripts/battlemapGenerator/data/preset-data.json')).json();
        this.backgroundImageList = this.presetData.forest.backgrounds;
        this.treeList = this.presetData.forest.trees;
    }

    setBackgroundSize(newBackgroundImage) {
        const sceneSize = backgroundManager.getBackgroundSize(newBackgroundImage);

        if (sceneSize.width && sceneSize.height) {
            return this.scene.update({ width: sceneSize.width, height: sceneSize.height });
        } else {
            ui.notifications.error("Failed to determine scene dimensions from the image name.");
            return Promise.reject(new Error("Failed to determine scene dimensions from the image name."));
        }
    }

    setBackgroundImage() {
        const newBackgroundImage = random.element(this.backgroundImageList);
        return this.scene.update({ "background.src": newBackgroundImage }).then(() => newBackgroundImage);
    }

    async generate() {
        try {
            await this.initializeData();
            // const newBackgroundImage = await this.setBackgroundImage();
            // await this.setBackgroundSize(newBackgroundImage);
            // await new Promise(resolve => setTimeout(resolve, 1000));
            await presetManager.spawnRandomPreset(this.treeList, this.sceneSize);
        } catch (err) {
            // Handle errors that occur during the map generation process
            console.error("Error generating the forest map:", err);
        }
    }
}
