import { BattleMap } from './BattleMap.js';
import * as backgroundManager from '../services/background-manager.js';
import * as presetManager from '../services/preset-manager.js';
import * as random from '../../utils/random.js';
import * as notifications from '../../utils/notifications.js';

export class ForestMap extends BattleMap {
    constructor() {
    }

    async initialize() {
        // Fetch the preset data asynchronously
        this.presetData = await (await fetch('modules/fftweaks/src/scripts/battlemapGenerator/data/preset-data.json')).json();
        this.backgroundImageList = this.presetData.forest.backgrounds;
        this.treeList = this.presetData.forest.trees;


    }

    setBackgroundSize(newBackgroundImage) {
        const sceneSize = backgroundManager.getBackgroundSize(newBackgroundImage);

        if (sceneSize.width && sceneSize.height) {
            return this.currentScene.update({ width: sceneSize.width, height: sceneSize.height });
        } else {
            ui.notifications.error("Failed to determine scene dimensions from the image name.");
            return Promise.reject(new Error("Failed to determine scene dimensions from the image name."));
        }
    }

    setBackgroundImage() {
        const newBackgroundImage = random.element(this.backgroundImageList);
        return this.currentScene.update({ "background.src": newBackgroundImage }).then(() => newBackgroundImage);
    }

    async spawnTrees(numberOfTrees = 1) {
        const sceneWidth = this.currentScene.width || this.currentScene.data.width;
        const sceneHeight = this.currentScene.height || this.currentScene.data.height;

        if (sceneWidth === undefined || sceneHeight === undefined) {
            return;
        }

        for (let i = 0; i < numberOfTrees; i++) {
            notifications.toggle(1);
            const tree = random.element(this.treeList);
            const x = random.number(0, sceneWidth);
            const y = random.number(0, sceneHeight);

            await presetManager.spawnPresetByUUID(tree, x, y);
        }
    }

    async generate() {
        try {
            // Initialize preset data
            await this.initialize();

            // Set the background image and get the new background image path
            const newBackgroundImage = await this.setBackgroundImage();

            // Set the scene size based on the new background image
            await this.setBackgroundSize(newBackgroundImage);

            // Introduce a delay before spawning the trees
            await this.delay(1000); // Delay in milliseconds, e.g., 1000ms = 1 second

            // Spawn trees on the map
            await this.spawnTrees(25);
        } catch (err) {
            // Handle errors that occur during the map generation process
            console.error("Error generating the forest map:", err);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


}

