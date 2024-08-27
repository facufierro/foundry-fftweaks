import * as random from '../../utils/random.js';
import * as backgroundManager from '../services/background-manager.js';
import * as presetManager from '../services/preset-manager.js';

export class Battlemap {
    constructor() {
        this.scene = game.scenes.get('4xErahF7PDwMuy2e');  // Replace with the correct scene ID or method to get the scene
        if (!this.scene) {
            throw new Error("Scene not found");
        }

        this.gridSize = { x: this.scene.grid.size, y: this.scene.grid.size };
        this.padding = this.scene.padding || 0;  // Get the scene padding
        this.backgroundImage = this.scene.background.src;
        this.sceneSize = { width: this.scene.width, height: this.scene.height }; // Make sure scene size is defined
    }

    async initializeData() {
        this.presetData = await (await fetch('modules/fftweaks/src/scripts/battlemapGenerator/data/preset-data.json')).json();
        this.backgroundImageList = this.presetData.forest.backgrounds;
        this.treeList = this.presetData.forest.trees; // This is the preset list you need to use
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

    async generateForest() {
        try {
            await this.initializeData();

            // Set the background image and get the new background image path
            const newBackgroundImage = await this.setBackgroundImage();

            // Set the scene size based on the new background image
            await this.setBackgroundSize(newBackgroundImage);

            // Introduce a delay before spawning the trees
            await this.delay(1000); // Delay in milliseconds, e.g., 1000ms = 1 second

            // Spawn trees on the map, considering the scene size and padding
            await presetManager.spawnRandomPreset(this.treeList, this.sceneSize, this.padding, 10);
        } catch (err) {
            // Handle errors that occur during the map generation process
            console.error("Error generating the forest map:", err);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
