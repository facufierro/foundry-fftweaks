import { BattleMap } from './BattleMap.js';
import { Random } from '../utils/randomizer.js';
import * as backgroundManager from '../services/background-manager.js';
import * as presetManager from '../services/preset-manager.js';
import * as notifications from '../utils/notifications.js';

export class ForestMap extends BattleMap {
    constructor(backgroundImage, gridSize = { x: 10, y: 10 }, padding = 0, treeDensity = 0.5) {
        super(backgroundImage, gridSize, padding);
        this.treeDensity = treeDensity;
        this.currentScene = game.scenes.viewed;
        this.random = new Random();
        this.backgroundImageList = backgroundManager.getBackgroundImages();
        this.presetData = null; // Will be populated after async fetch
    }

    async initialize() {
        // Fetch the preset data asynchronously
        this.presetData = await (await fetch('modules/fftweaks/src/scripts/battlemapGenerator/data/preset-data.json')).json();
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
        const newBackgroundImage = this.random.element(this.backgroundImageList);
        return this.currentScene.update({ "background.src": newBackgroundImage }).then(() => newBackgroundImage);
    }

    async spawnTrees(numberOfTrees = 1) {
        if (!this.presetData || !this.presetData.forest || !Array.isArray(this.presetData.forest.trees) || this.presetData.forest.trees.length === 0) {
            return;
        }

        const treeList = this.presetData.forest.trees;
        const sceneWidth = this.currentScene.width || this.currentScene.data.width;
        const sceneHeight = this.currentScene.height || this.currentScene.data.height;

        if (sceneWidth === undefined || sceneHeight === undefined) {
            return;
        }

        for (let i = 0; i < numberOfTrees; i++) {
            notifications.toggle(2);

            const preset = this.random.element(treeList);
            const x = this.random.number(0, sceneWidth);
            const y = this.random.number(0, sceneHeight);

            await presetManager.spawnPresetByUUID(preset, x, y);
        }
    }




    async generate() {

        await this.initialize(); // Ensure preset data is loaded before generating
        // this.setBackgroundImage()
        //     .then((newBackgroundImage) => {
        //         return this.setBackgroundSize(newBackgroundImage);
        //     })
        //     .then(() => {
        //         ui.notifications.info(`Forest map generated with tree density of ${this.treeDensity}.`);
        //     })
        //     .catch(err => {
        //         console.error("Error generating the forest map:", err);
        //         ui.notifications.error("Failed to generate the forest map.");
        //     });

        await this.spawnTrees(10);
    }
}

