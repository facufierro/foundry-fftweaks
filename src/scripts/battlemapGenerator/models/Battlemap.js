import * as random from '../../utils/random.js';
import * as backgroundManager from '../services/background-manager.js';
import * as presetManager from '../services/preset-manager.js';
import * as dataManager from '../services/data-manager.js';

export class Battlemap {
    constructor() {
        this.scene = game.scenes.get('4xErahF7PDwMuy2e');
        if (!this.scene) {
            throw new Error("Scene not found");
        }

        this.gridSize = { x: this.scene.grid.size, y: this.scene.grid.size };
        this.padding = this.scene.padding || 0;
        this.backgroundImage = this.scene.background.src;
        this.sceneSize = { width: this.scene.width, height: this.scene.height };
    }

    async generateForest() {
        try {
            const presetData = await dataManager.initializeData();  // Fetch all data

            // Validate that backgrounds are an array and not empty
            if (!Array.isArray(presetData.forest.backgrounds) || presetData.forest.backgrounds.length === 0) {
                throw new Error("The background image list is empty or not an array.");
            }

            this.backgroundImageList = presetData.forest.backgrounds;  // Use forest backgrounds

            const newBackgroundImage = await backgroundManager.setBackgroundImage(this.scene);
            await backgroundManager.setBackgroundSize(newBackgroundImage);

            await this.delay(1000);

            // Validate that trees are an array and not empty before spawning
            if (!Array.isArray(presetData.forest.trees) || presetData.forest.trees.length === 0) {
                throw new Error("The trees list is empty or not an array.");
            }

            await presetManager.spawnRandomPreset(presetData.forest.trees, this.sceneSize, this.padding, 10);
        } catch (err) {
            console.error("Error generating the forest map:", err);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
