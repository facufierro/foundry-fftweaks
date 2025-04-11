// Item Macro
character = new FFT.Character(actor);
spellNames = ["Mending"]
await FFT.SpellSelector.addSpellsByName(character, spellNames);
await effect.delete();

// Create Item
// List of items mapped to their compendium UUIDs
const items = {
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

// Build item selection UI
let content = `<style>
  .item-list { display: flex; flex-direction: column; gap: 5px; }
  .item-entry { display: flex; align-items: center; gap: 10px; padding: 5px; border: 1px solid gray; border-radius: 5px; cursor: pointer; }
  .item-entry:hover { background: rgba(255,255,255,0.1); }
  .item-icon { width: 30px; height: 30px; object-fit: contain; }
</style><div class="item-list">`;

for (let [name, uuid] of Object.entries(items)) {
    let item = await fromUuid(uuid);
    let img = item?.img || "icons/svg/mystery-man.svg";
    content += `<div class="item-entry" data-id="${uuid}">
        <img src="${img}" class="item-icon">
        <span>${name}</span>
    </div>`;
}
content += `</div>`;

// Callback to handle item adding logic
const onClickItem = async (html) => {
    const clicked = $(html).find(".item-entry");
    clicked.click(async function () {
        const itemId = $(this).attr("data-id");
        const item = await fromUuid(itemId);
        if (!item) {
            ui.notifications.error("Item not found in compendium.");
            return;
        }

        // Check if already owned
        const existing = actor.items.find(i => i.name === item.name);
        if (existing) {
            await existing.update({ "system.quantity": existing.system.quantity + 1 });
            ui.notifications.info(`${item.name} quantity increased.`);
        } else {
            await actor.createEmbeddedDocuments("Item", [item.toObject()]);
            ui.notifications.info(`${item.name} added to inventory.`);
        }

        // Close the dialog manually
        $(this).closest('.dialog').find('.dialog-button.default').trigger('click');
    });
};

// Create and show dialog using FFT.CustomDialog
new FFT.CustomDialog(
    "Select an Item",
    content,
    {
        yes: {
            label: "Close",
            callback: () => { }
        }
    },
    "yes",
    {
        render: onClickItem
    }
).render();
await effect.delete();
