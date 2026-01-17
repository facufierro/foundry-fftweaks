async function runicInscription(item): Promise<void> {
  if (!item) {
    ui.notifications.warn("This macro must be run from an item.");
    return;
  }

  const owningActor = item.parent;

  const effect = item.effects.find(e => e.name === "Glyph");
  if (!effect) {
    ui.notifications.warn("Effect named 'Glyph' not found in item.");
    return;
  }

  const spells = owningActor.items.filter((i): i is Item5e => {
    const level = (i.system as any)?.level;
    return i.type === "spell" && typeof level === "number" && level > 0;
  });

  if (spells.length === 0) {
    ui.notifications.warn("No eligible spells found.");
    return;
  }

  const dialogStyle = `
    <style>
      .fft-dialog .fft-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .fft-dialog .header {
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .fft-dialog .filter-row {
        display: flex;
        align-items: center;
        padding: 0 8px;
        box-sizing: border-box;
        background: #222;
        color: #fff;
        border-bottom: 1px solid #444;
        height: 40px;
      }
      .fft-dialog .filter-row label {
        white-space: nowrap;
      }
      .fft-dialog .filter-row input {
        height: 24px;
        margin: 0 8px 0 4px;
        background: transparent;
        color: #fff;
        border: 1px solid #444;
        padding: 0 4px;
      }
      .fft-dialog .data-container {
        flex: 1;
        overflow: auto;
      }
      .fft-dialog .data-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 0.9em;
      }
      .fft-dialog .data-table col:nth-child(1) {
        width: 50px;
      }
      .fft-dialog .data-table tbody tr td {
        border: 1px solid #444;
        text-align: center;
        padding: 2px 4px;
      }
      .fft-dialog .spell-name-cell {
        text-align: left !important;
        padding-left: 4px;
      }
      .fft-dialog .button-row {
        flex: 0 0 40px;
        position: sticky;
        bottom: 0;
        z-index: 10;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #222;
        border-top: 1px solid #444;
      }
      .fft-dialog #accept-btn {
        width: 100px;
        height: 28px;
      }
    </style>
  `;


  const chosenSpellUUID = await new Promise<string | null>((resolve) => {
    const dialogInstance: any = new Dialog({

      title: "Select a Spell for Glyph",
      content: `
        <div class="fft-dialog">
          ${dialogStyle}
          <div class="fft-container">
            <div class="header">
              <div class="filter-row">
                <label for="spell-filter">Filter:</label>
                <input type="text" id="spell-filter" placeholder="Search spell name..." />
              </div>
            </div>
            <div class="data-container">
              <table class="data-table">
                <colgroup>
                  <col style="width: 30px;" />
                  <col />
                  <col style="width: 80px;" />
                </colgroup>
                <tbody id="spell-list">
                  ${spells.map(spell => `
                    <tr>
                      <td><input type="radio" name="spell-choice" value="${spell.uuid}" /></td>
                      <td class="spell-name-cell item-tooltip rollable" 
                          data-uuid="${spell.uuid}" 
                          role="button"
                          data-action="use"
                          aria-label="${spell.name}"
                          data-tooltip="<section class='loading' data-uuid='${spell.uuid}'><i class='fas fa-spinner fa-spin-pulse'></i></section>"
                          data-tooltip-class="dnd5e2 dnd5e-tooltip item-tooltip"
                          data-tooltip-direction="LEFT">
                        ${spell.name}
                      </td>
                      <td>[${(spell.system as any).level}]</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
            <div class="button-row">
              <button id="accept-btn" type="button">Accept</button>
            </div>
          </div>
        </div>
      `,
      buttons: {},
      render: (html: JQuery) => {
        game.tooltip.activate(html[0]);

        html.find(".spell-name-cell").on("click", async function () {
          const uuid = $(this).data("uuid");
          if (!uuid) return;
          const spellItem = await fromUuid(uuid);
          if (spellItem instanceof Item) spellItem.sheet.render(true);
        });

        html.find("#spell-filter").on("input", function () {
          const term = (this as HTMLInputElement).value.toLowerCase();
          html.find("#spell-list tr").each((_, row) => {
            const name = $(row).find(".spell-name-cell").text().toLowerCase();
            $(row).toggle(name.includes(term));
          });
        });

        html.find("#accept-btn").on("click", () => {
          const selected = html.find("input[name='spell-choice']:checked").val();
          if (!selected || typeof selected !== "string") {
            ui.notifications.warn("Select a spell first.");
            return;
          }
          resolve(selected);
          dialogInstance.close();
        });
      },
      close: () => resolve(null)
    }).render(true);
  });

  if (!chosenSpellUUID) return;

  const changes = foundry.utils.duplicate(effect.changes);
  const change = changes.find(c => c.key === "activities[cast].spell.uuid");

  if (change && typeof change === "object") {
    (change as { key: string; value: string }).value = chosenSpellUUID;
    await item.updateEmbeddedDocuments("ActiveEffect", [{
      _id: effect.id,
      changes
    }]);
    ui.notifications.info("Effect updated with selected spell.");
  } else {
    ui.notifications.warn("Change key not found in effect.");
  }
}
