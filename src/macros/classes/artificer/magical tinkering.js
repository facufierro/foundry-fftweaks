// Ensure a token is selected
let actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
    ui.notifications.warn("You must select a token with an assigned character.");
    return;
}

// List of items mapped to their compendium IDs
let items = {
    "Ball Bearings": "Compendium.fftweaks.classes.Item.MarWpSSYt7VXykxe",
    "Net": "Compendium.fftweaks.classes.Item.8FZ75JNhp1qq0NHc",
    "Basket": "Compendium.fftweaks.classes.Item.6ohoz06qiMRPB7F0",
    "Oil": "Compendium.fftweaks.classes.Item.mggFEQobg5DXA9lw",
    "Bedroll": "Compendium.fftweaks.classes.Item.GQxsonOwGBwJDxUF",
    "Paper": "Compendium.fftweaks.classes.Item.esAUHUrQFv6L7uD8",
    "Bell": "Compendium.fftweaks.classes.Item.wBSZTemPxkoEXaHa",
    "Parchment": "Compendium.fftweaks.classes.Item.4d4FVJTU6TLJu1Qs",
    "Blanket": "Compendium.fftweaks.classes.Item.nHSu2Xp75yzsIuRh",
    "Pole": "Compendium.fftweaks.classes.Item.2dO4UG82mwfYBYAA",
    "Block and Tackle": "Compendium.fftweaks.classes.Item.HTxZAHhRl4TcwnRh",
    "Pouch": "Compendium.fftweaks.classes.Item.jlr45yEiMKw2U3Lg",
    "Bucket": "Compendium.fftweaks.classes.Item.VcDuyoF3sF15lEEj",
    "Rope": "Compendium.fftweaks.classes.Item.FWSv0zGWKKOGqGVy",
    "Caltrops": "Compendium.fftweaks.classes.Item.lkdJChvVcFtoiWaR",
    "Sack": "Compendium.fftweaks.classes.Item.9l0FtGVavUM7jr1Q",
    "Candle": "Compendium.fftweaks.classes.Item.qofKqBzz8IqiaqID",
    "Shovel": "Compendium.fftweaks.classes.Item.tqBVYVqsmyPjoqRT",
    "Crowbar": "Compendium.fftweaks.classes.Item.UPSiFTKgVkxX0u1E",
    "String": "Compendium.fftweaks.classes.Item.aVcoSo5r0qJ1FnwQ",
    "Flask": "Compendium.fftweaks.classes.Item.Y7f2VKnE3mFgJKBQ",
    "Tinderbox": "Compendium.fftweaks.classes.Item.gYc50kfJS5RVumhN",
    "Jug": "Compendium.fftweaks.classes.Item.Z4U7sh9KyLawGM7S",
    "Torch": "Compendium.fftweaks.classes.Item.xvTtsUI8HZSppCpl"
};

// Function to retrieve item from compendium and add to actor
async function addItemToActor(itemId, dialog) {
    let item = await fromUuid(itemId);
    if (!item) {
        ui.notifications.error("Item not found in compendium.");
        return;
    }
    
    // Check if the actor already has this item
    let existingItem = actor.items.find(i => i.name === item.name);
    if (existingItem) {
        await existingItem.update({ "system.quantity": existingItem.system.quantity + 1 });
        ui.notifications.info(`${item.name} quantity increased.`);
    } else {
        await actor.createEmbeddedDocuments("Item", [item.toObject()]);
        ui.notifications.info(`${item.name} added to inventory.`);
    }
    
    // Close the dialog after selecting an item
    dialog.close();
}

// Build the HTML content for a **tidy vertical list with icons**
let content = `<style>
    .item-list { display: flex; flex-direction: column; gap: 5px; }
    .item-entry { display: flex; align-items: center; gap: 10px; padding: 5px; border: 1px solid gray; border-radius: 5px; cursor: pointer; }
    .item-entry:hover { background: rgba(255,255,255,0.1); }
    .item-icon { width: 30px; height: 30px; object-fit: contain; }
</style>`;

content += `<div class="item-list">`;

for (let [name, id] of Object.entries(items)) {
    let item = await fromUuid(id);
    let img = item?.img || "icons/svg/mystery-man.svg"; // Default icon if missing
    content += `<div class="item-entry" data-id="${id}">
        <img src="${img}" class="item-icon">
        <span>${name}</span>
    </div>`;
}

content += `</div>`;

// Create the **interactive dialog**
let d = new Dialog({
    title: "Select an Item",
    content: content,
    buttons: {},
    render: (html) => {
        html.find(".item-entry").click(async function () {
            let itemId = $(this).attr("data-id");
            await addItemToActor(itemId, d);
        });
    }
}).render(true);
