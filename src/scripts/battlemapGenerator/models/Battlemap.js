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
            const { backgrounds, trees } = (await dataManager.initializeData()).forest;
            const newBackgroundImage = await backgroundManager.setBackgroundImage(this.scene, backgrounds);
            await backgroundManager.setBackgroundSize(this.scene, newBackgroundImage);
            await new Promise(resolve => Hooks.once('updateScene', scene => {
                if (scene.id === this.scene.id) resolve(this.sceneSize = { width: scene.width, height: scene.height });
            }));
            await presetManager.spawnRandomPreset(trees, this.sceneSize, this.padding, 30);
        } catch (err) {
            console.error("Error generating the forest map:", err);
        }
    }
}