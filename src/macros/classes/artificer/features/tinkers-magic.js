//RunOnCreate
character = new FFT.Character(actor);
spellNames = ["Mending"]
await FFT.SpellSelector.addSpellsByName(character, spellNames);

//Item Macro
const character = new FFT.Character(token.actor);
const compendiumId = "fftweaks.items";
const itemNames = ["Ball Bearings", "Net", "Basket", "Oil", "Bedroll", "Paper", "Bell", "Parchment", "Blanket", "Pole", "Block and Tackle", "Pouch", "Bucket", "Rope", "Caltrops", "Sack", "Candle", "Shovel", "Crowbar", "String", "Flask", "Tinderbox", "Jug", "Torch"];
const macroCode = `//RunOnCreate
Hooks.once("dnd5e.restCompleted", (actor, data) => {
  if (actor.uuid !== item.parent?.uuid) return;
  ui.notifications.info(\`As you rest, the \${item.name} made with Tinker's Magic fades away.\`);
  item.delete();
});`;

openItemSelectionDialog(character, compendiumId, itemNames, macroCode);
// Add item by name using Character class and attach given macro
async function addItemToActor(name, character, compendiumId, macroCode) {
  const pack = game.packs.get(compendiumId);
  if (!pack) return;

  const entry = (await pack.getIndex()).find(e => e.name === name);
  if (!entry) return;

  const item = await pack.getDocument(entry._id);
  const actor = character.actor;

  // Check if item already exists
  const existing = actor.items.find(i => i.name === item.name);
  if (existing) return existing.update({ "system.quantity": existing.system.quantity + 1 });

  // Add the item to the actor's inventory
  await character.addItemsByName([name], compendiumId);
  const created = actor.items.find(i => i.name === name);

  if (created) {
    // Create the macro and set it on the item
    const macro = await Macro.create({
      name: created.name,
      type: "script",
      scope: "global",
      command: macroCode
    });

    // Attach the macro to the item
    await created.setMacro(macro);

    // Execute the macro directly from the item
    await created.executeMacro();
  }
}


async function openItemSelectionDialog(character, compendiumId, itemNames, macroCode) {
  const pack = game.packs.get(compendiumId);
  if (!pack) return;

  const index = await pack.getIndex();
  const entries = index.filter(e => itemNames.includes(e.name));

  const style = `
    <style>
      .fft-item-dialog .item-grid {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 8px; padding: 8px;
      }
      .fft-item-dialog .item-entry {
        display: flex; align-items: center; gap: 8px;
        padding: 4px; border: 1px solid #666;
        border-radius: 5px; cursor: pointer;
        background: rgba(0,0,0,0.2);
      }
      .fft-item-dialog .item-entry:hover {
        background-color: rgba(255,255,255,0.1);
      }
      .fft-item-dialog .item-icon {
        width: 30px; height: 30px; object-fit: contain;
      }
    </style>`;

  let content = `${style}<div class="fft-item-dialog"><div class="item-grid">`;

  for (const entry of entries) {
    const uuid = `Compendium.${compendiumId}.${entry._id}`;
    const item = await fromUuid(uuid);
    content += `
      <div class="item-entry" data-name="${item.name}">
        <img src="${item.img}" class="item-icon"><span>${item.name}</span>
      </div>`;
  }

  content += `</div></div>`;

  new FFT.CustomDialog("Select an Item", content, {}, "", {
    render: html => {
      html.find(".item-entry").on("click", async function () {
        const name = $(this).data("name");
        await addItemToActor(name, character, compendiumId, macroCode);
        html.closest(".app.dialog").remove();
      });
    }
  }).render();
}

