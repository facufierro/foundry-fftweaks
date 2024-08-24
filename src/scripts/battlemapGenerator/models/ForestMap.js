import { BattleMap } from './BattleMap.js';
import { Random } from '../utils/randomizer.js';
import * as backgroundManager from '../services/background-manager.js';

export class ForestMap extends BattleMap {
    constructor(backgroundImage, gridSize = { x: 10, y: 10 }, padding = 0, treeDensity = 0.5) {
        super(backgroundImage, gridSize, padding);
        this.treeDensity = treeDensity;
        this.currentScene = game.scenes.viewed;
        this.random = new Random();
        this.backgroundImageList = backgroundManager.getBackgroundImages();
    }

    // Method to set the grid size based on the selected background image's name
    setBackgroundSize(newBackgroundImage) {
        const sceneSize = backgroundManager.getBackgroundSize(newBackgroundImage);

        if (sceneSize.width && sceneSize.height) {
            this.currentScene.update({ width: sceneSize.width, height: sceneSize.height }).then(() => {
                ui.notifications.info(`Scene dimensions updated successfully to ${sceneSize.width}x${sceneSize.height}!`);
            }).catch(err => {
                console.error("Error updating the scene dimensions:", err);
                ui.notifications.error("Failed to update the scene dimensions.");
            });
        } else {
            ui.notifications.error("Failed to determine scene dimensions from the image name.");
        }
    }

    // Method to set the background image
    setBackgroundImage() {
        const newBackgroundImage = this.random.image(this.backgroundImageList);
        if (this.currentScene) {
            this.currentScene.update({ "background.src": newBackgroundImage }).then(() => {
                this.setBackgroundSize(newBackgroundImage); // Set grid size based on the new background image
                ui.notifications.info(`Background image updated successfully to ${newBackgroundImage}!`);
            }).catch(err => {
                console.error("Error updating the background image:", err);
                ui.notifications.error("Failed to update the background image.");
            });
        } else {
            ui.notifications.error("No scene is currently active.");
        }
    }

    generate() {
        // Generate the map by setting the background image and adjusting the grid size
        this.setBackgroundImage();
        ui.notifications.info(`Generating forest map with tree density of ${this.treeDensity}`);
        // Additional forest generation logic would go here
    }
}
