import * as random from "../../utilities/random.js";

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

export function setBackgroundSize(scene, newBackgroundImage) {
    const sceneSize = getBackgroundSize(newBackgroundImage);

    if (sceneSize.width && sceneSize.height) {
        return scene.update({ width: sceneSize.width, height: sceneSize.height });
    } else {
        return Promise.reject(new Error("Failed to determine scene dimensions from the image name."));
    }
}


export function setBackgroundImage(scene, backgroundImageList) {
    if (!Array.isArray(backgroundImageList) || backgroundImageList.length === 0) {
        throw new Error("The background image list is empty or not an array.");
    }
    const newBackgroundImage = random.element(backgroundImageList);
    return scene.update({ "background.src": newBackgroundImage }).then(() => newBackgroundImage);
}