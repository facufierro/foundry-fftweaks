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
            const presetData = await dataManager.initializeData();

            if (!Array.isArray(presetData.forest.backgrounds) || presetData.forest.backgrounds.length === 0) {
                throw new Error("The background image list is empty or not an array.");
            }

            this.backgroundImageList = presetData.forest.backgrounds;

            // Set the background image
            const newBackgroundImage = await backgroundManager.setBackgroundImage(this.scene, this.backgroundImageList);

            // Update the scene size
            await backgroundManager.setBackgroundSize(this.scene, newBackgroundImage);

            // Wait for the scene update using Foundry's Hooks
            await new Promise(resolve => {
                Hooks.once('updateScene', (scene, updateData) => {
                    if (scene.id === this.scene.id) {
                        // Ensure the scene size is updated after the background change
                        this.sceneSize = { width: this.scene.width, height: this.scene.height };
                        resolve();
                    }
                });
            });

            // Ensure trees data is valid
            if (!Array.isArray(presetData.forest.trees) || presetData.forest.trees.length === 0) {
                throw new Error("The trees list is empty or not an array.");
            }

            // Spawn trees on the updated scene
            await presetManager.spawnRandomPreset(presetData.forest.trees, this.sceneSize, this.padding, 10);
        } catch (err) {
            console.error("Error generating the forest map:", err);
        }
    }
}

