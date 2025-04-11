//RunOnCreate
let actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
    ui.notifications.warn("You must select a token with an assigned character.");
    return;
}
// Create Item Activity
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

// Add item to actor
async function addItemToActor(itemId) {
    const item = await fromUuid(itemId);
    if (!item) return ui.notifications.error("Item not found in compendium.");

    const existing = actor.items.find(i => i.name === item.name);
    if (existing) {
        await existing.update({ "system.quantity": existing.system.quantity + 1 });
        ui.notifications.info(`${item.name} quantity increased.`);
    } else {
        await actor.createEmbeddedDocuments("Item", [item.toObject()]);
        ui.notifications.info(`${item.name} added to inventory.`);
    }
}

// Build and render the dialog
async function openItemSelectionDialog() {
    const contentStyle = `
      <style>
        .fft-item-dialog .item-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 8px;
        }
        .fft-item-dialog .item-entry {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px;
          border: 1px solid #666;
          border-radius: 5px;
          cursor: pointer;
          background: rgba(0,0,0,0.2);
        }
        .fft-item-dialog .item-entry:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .fft-item-dialog .item-icon {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }
      </style>`;

    let content = `${contentStyle}<div class="fft-item-dialog"><div class="item-grid">`;

    for (const [name, uuid] of Object.entries(items)) {
        const item = await fromUuid(uuid);
        const img = item?.img || "icons/svg/mystery-man.svg";
        const safeName = name.replace(/"/g, '&quot;');
        content += `
        <div class="item-entry item-tooltip"
             data-uuid="${uuid}" 
             data-tooltip="<section class='loading' data-uuid='${uuid}'><i class='fas fa-spinner fa-spin-pulse'></i></section>" 
             data-tooltip-class="dnd5e2 dnd5e-tooltip item-tooltip" 
             data-tooltip-direction="LEFT"
             role="button">
          <img src="${img}" class="item-icon">
          <span>${safeName}</span>
        </div>`;
    }

    content += `</div></div>`;

    // Define the dialog variable first
    let dialog;

    dialog = new FFT.CustomDialog(
        "Select an Item",
        content,
        {},
        "",
        {
            render: html => {
                html.find(".item-entry").on("click", async function () {
                    const uuid = $(this).data("uuid");
                    await addItemToActor(uuid);
                    html.closest(".app.dialog").remove();
                });
            }
        }
    );

    dialog.render();
}

// Run it
openItemSelectionDialog();
