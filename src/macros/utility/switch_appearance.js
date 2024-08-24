function updateTokenImageBasedOnEquippedItem(imagePaths) {
    let actor = game.actors.getName("Hreidmar");
    let token = canvas.tokens.placeables.find(t => t.actor?.id === actor.id);

    if (!token) {
        ui.notifications.error(`No token found for actor named "${actor.name}".`);
        return;
    }

    let equippedItems = actor.items.filter(item => item.system.equipped);
    let matchedImagePath = null;
    let shieldEquipped = equippedItems.some(item => item.name.toLowerCase().includes("shield"));

    for (let item of equippedItems) {
        let itemName = item.name.toLowerCase();
        for (let imagePath of imagePaths) {
            let imageName = imagePath.split('/').pop().split('.')[0].toLowerCase();
            if (shieldEquipped && itemName.includes("warhammer") && imageName.includes("warhammer_shield")) {
                matchedImagePath = imagePath;
                break;
            } else if (imageName.includes(itemName.replace(/\s+/g, '_'))) {
                matchedImagePath = imagePath;
                break;
            }
        }
        if (matchedImagePath) break;
    }

    if (matchedImagePath) {
        token.document.update({
            'texture.src': matchedImagePath
        });
    } else {
        ui.notifications.warn(`No matching image found for equipped items.`);
    }
}

// Example usage:
const imagePaths = [
    "assets/fftweaks/tokens/Players/hreidmar/hreidmar-warhammer.webp",
    "assets/fftweaks/tokens/Players/hreidmar/hreidmar-warhammer_shield.webp",
    "assets/fftweaks/tokens/Players/hreidmar/hreidmar-crossbow.webp",
    "assets/fftweaks/tokens/Players/hreidmar/hreidmar-unarmed_strike.webp"
];

updateTokenImageBasedOnEquippedItem(imagePaths);