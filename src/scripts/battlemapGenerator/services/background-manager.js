import * as random from "../../utils/random.js";

export function getBackgroundSize(name) {
    const sizePattern = /(\d+)x(\d+)/;
    const match = name.match(sizePattern);

    if (match) {
        const width = parseInt(match[1], 10) * 100;
        const height = parseInt(match[2], 10) * 100;
        return { width, height };
    } else {
        console.error("No scene dimensions found in the image name.");
        return { width: undefined, height: undefined };
    }
}

export function setBackgroundSize(newBackgroundImage) {
    const sceneSize = getBackgroundSize(newBackgroundImage);

    if (sceneSize.width && sceneSize.height) {
        return this.scene.update({ width: sceneSize.width, height: sceneSize.height });
    } else {
        return Promise.reject(new Error("Failed to determine scene dimensions from the image name."));
    }
}

export function setBackgroundImage(scene) {
    const newBackgroundImage = random.element(this.backgroundImageList);
    return scene.update({ "background.src": newBackgroundImage }).then(() => newBackgroundImage);
}