namespace FFT {
  export class SpellSelector {
    private static _dialogHtml: JQuery | null = null;

    static renderButton(actor: Actor5e, html: JQuery<HTMLElement>) {
      const character = new Character(actor);
      const buttonHolder = html.find('.sheet-header-buttons');
      if (!buttonHolder.length || html.find("#fft-custom-button").length) return;

      const button = new FFT.CustomButton({
        id: "fft-spellselector-button",
        tooltip: "Spell Selector",
        iconClass: "fas fa-book-spells",
        onClick: () => {
          // Pass the desired choicesNumber here (for example, 2)
          this.renderDialog(character, 2);
        }
      });

      button.appendTo(buttonHolder);
    }

    static async renderDialog(character: Character, choicesNumber?: number): Promise<void> {
      const journal = await this.getSpellJournal();
      if (!journal) return;

      const content = this.buildDialogContent(journal);
      if (!content) return;

      return new Promise<void>((resolve) => {
        let dialogInstance: Dialog;
        dialogInstance = new Dialog({
          title: "Spell Selector",
          content: content,
          buttons: {
          },
          render: (html: JQuery) => {
            this._dialogHtml = html;
            this.initializeDialogEvents(html, character, dialogInstance, choicesNumber);
          },
          close: () => {
            resolve(); // Also resolve if closed manually
          }
        });

        dialogInstance.render(true);

        Hooks.once("renderDialog", () => {
          const w = window.innerWidth * 0.75;
          const h = window.innerHeight * 0.8;
          const left = (window.innerWidth - w) / 2;
          const top = (window.innerHeight - h) / 2;
          dialogInstance.setPosition({ width: w, height: h, left, top });
        });
      });
    }

    static buildDialogContent(journal: JournalEntry): string | null {
      const pages = journal.pages.contents || [];
      if (!pages.length) {
        return null;
      }
      const classNames = pages.map((p: any) => p.name);

      const rankOptions = `
        <option value="All">All</option>
        <option value="0">Cantrip</option>
        <option value="1">1st</option>
        <option value="2">2nd</option>
        <option value="3">3rd</option>
        <option value="4">4th</option>
        <option value="5">5th</option>
        <option value="6">6th</option>
        <option value="7">7th</option>
        <option value="8">8th</option>
        <option value="9">9th</option>
      `;
      const classOptions = classNames.map((c) => `<option value="${c}">${c}</option>`).join("");

      return `
        <div class="fft-dialog">
          <style>
            .fft-dialog .fft-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .fft-dialog .filter-row {
              flex: 0 0 40px;
              display: flex;
              align-items: center;
              padding: 0 8px;
              box-sizing: border-box;
              position: sticky;
              top: 0;
              z-index: 10;
              background: #222;
              color: #fff;
              border-bottom: 1px solid #444;
            }
            .fft-dialog .filter-row label { white-space: nowrap; }
            .fft-dialog .filter-row input,
            .fft-dialog .filter-row select {
              height: 24px;
              margin: 0 8px 0 4px;
              background: transparent;
              color: #fff;
              border: 1px solid #444;
              padding: 0 4px;
            }
            .fft-dialog .filter-row input::placeholder {
              color: #fff;
              opacity: 1;
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
            .fft-dialog .data-table col:nth-child(1) { width: 50px; }
            .fft-dialog .data-table col:nth-child(2) { width: auto; }
            .fft-dialog .data-table col:nth-child(3) { width: 100px; }
            .fft-dialog .data-table col:nth-child(4) { width: 100px; }
            .fft-dialog .data-table tbody tr td {
              border: 1px solid #444;
              text-align: center;
              padding: 2px 4px;
              line-height: 1.0;
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
          <div class="fft-container">
            <div class="filter-row">
              <label for="spell-name-filter">Name:</label>
              <input type="text" id="spell-name-filter" placeholder="Find spell..." />
              <label for="spell-class">Class:</label>
              <select id="spell-class">${classOptions}</select>
              <label for="spell-rank">Rank:</label>
              <select id="spell-rank">${rankOptions}</select>
            </div>
            <div class="data-container">
              <table class="data-table">
                <colgroup>
                  <col />
                  <col />
                  <col />
                  <col />
                </colgroup>
                <tbody id="spell-list">
                  <tr><td colspan="4">Select a class to view spells</td></tr>
                </tbody>
              </table>
            </div>
            <div class="button-row">
              <button id="accept-btn" type="button">Accept</button>
            </div>
          </div>
        </div>
      `;
    }

    static initializeDialogEvents(html: JQuery, character: Character, dialog: Dialog, choicesNumber: number) {
      const nameInput = html[0].querySelector("#spell-name-filter") as HTMLInputElement;
      const classSelect = html[0].querySelector("#spell-class") as HTMLSelectElement;
      const rankSelect = html[0].querySelector("#spell-rank") as HTMLSelectElement;
      const acceptBtn = html[0].querySelector("#accept-btn") as HTMLButtonElement;

      // When filters change, refresh the spell list then enforce the limit.
      const updateHandler = () => {
        this.refreshKnownSpells(character).then(() => {
          this.enforceChoiceLimit(html, choicesNumber);
        });
      };

      nameInput.addEventListener("input", updateHandler);
      classSelect.addEventListener("change", updateHandler);
      rankSelect.addEventListener("change", updateHandler);
      acceptBtn.addEventListener("click", async () => {
        await this.addSelectedSpells(character, html, dialog);
        dialog.close();
      });

      // Delegate a change event on any checkbox within the spell list.
      html.find("#spell-list").on("change", "input[type='checkbox']", () => {
        this.enforceChoiceLimit(html, choicesNumber);
      });

      updateHandler();
    }

    static async addSelectedSpells(character: FFT.Character, html: JQuery, dialog: Dialog) {
      const spellRows = html[0].querySelectorAll("#spell-list tr");

      const selectedSpellNames: string[] = [];
      const visibleKnownSpellNames: string[] = [];

      spellRows.forEach(row => {
        const checkbox = row.querySelector("input[type='checkbox']") as HTMLInputElement;
        const nameCell = row.querySelector(".spell-name-cell");
        if (!checkbox || !nameCell) return;

        const spellName = nameCell.textContent?.trim();
        if (!spellName) return;

        const lowerName = spellName.toLowerCase();

        if (checkbox.checked) {
          selectedSpellNames.push(spellName);
        }

        if (character.spells.some(spell => (spell.name as string).toLowerCase() === lowerName)) {
          visibleKnownSpellNames.push(spellName);
        }
      });

      // Filter out known spells that are no longer selected
      const namesToRemove = visibleKnownSpellNames.filter(name =>
        !selectedSpellNames.includes(name)
      );

      if (namesToRemove.length > 0) {
        await character.removeItemsByName(namesToRemove);
      }

      // Filter out known spells from selected so we don’t re-add
      const knownSpellNames = new Set(character.spells.map(spell => (spell.name as string).toLowerCase()));

      const newSpellNames = selectedSpellNames.filter(
        name => !knownSpellNames.has(name.toLowerCase())
      );

      if (newSpellNames.length === 0) {
        return;
      }

      const spellsPack = game.packs.get("fftweaks.spells");
      if (!spellsPack) {
        return;
      }

      await spellsPack.getIndex();
      const documents = await spellsPack.getDocuments();
      const itemsToAdd = documents.filter(item => newSpellNames.includes(item.name));

      if (itemsToAdd.length === 0) {
      } else {
        await character.actor.createEmbeddedDocuments("Item", itemsToAdd.map(item => item.toObject()));
      }
    }

    static async updateSpellList(html: JQuery, knownSpellNames: Set<string>) {
      const nameInput = html[0].querySelector("#spell-name-filter") as HTMLInputElement;
      const classSelect = html[0].querySelector("#spell-class") as HTMLSelectElement;
      const rankSelect = html[0].querySelector("#spell-rank") as HTMLSelectElement;
      const spellList = html[0].querySelector("#spell-list") as HTMLTableSectionElement;

      const nameFilter = nameInput.value.toLowerCase().trim();
      const selectedClass = classSelect.value;
      const selectedRank = rankSelect.value;

      const spellIds = await this.getClassSpells(selectedClass);
      const spellsPack = game.packs.get("fftweaks.spells");
      if (spellsPack) await spellsPack.getIndex();

      if (!spellIds.length) {
        spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
        return;
      }

      const spells = await Promise.all(
        spellIds.map(async (id) => {
          const item = await fromUuid(id) as any;
          if (!item) return null;
          const name = item.name;
          const level = item.system?.level ?? 0;
          const range = this.getRangeString(item);
          return { name, level, range };
        })
      );
      const validSpells = spells.filter(sp => sp !== null);

      let filtered = validSpells.filter(sp => sp.name.toLowerCase().includes(nameFilter));
      if (selectedRank !== "All") {
        const numericRank = parseInt(selectedRank);
        filtered = filtered.filter(sp => sp.level === numericRank);
      }

      if (!filtered.length) {
        spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
        return;
      }

      // Note the addition of the data-is-known attribute.
      spellList.innerHTML = filtered.map(sp => {
        const isKnown = knownSpellNames.has(sp.name.toLowerCase());
        return `
          <tr>
            <td>
              <input type="checkbox" data-is-known="${isKnown}" ${isKnown ? "checked" : ""} />
            </td>
            <td class="spell-name-cell">${sp.name}</td>
            <td>${sp.level === 0 ? "Cantrip" : sp.level}</td>
            <td>${sp.range}</td>
          </tr>
        `;
      }).join("");
    }

    static getRangeString(item: any): string {
      const rng = item.system?.range;
      if (!rng) return "";
      if (rng.value && rng.units) return `${rng.value} ${rng.units}`;
      return rng.long ?? rng.value ?? "";
    }

    static async getSpellJournal(): Promise<JournalEntry | null> {
      const pack = game.packs.get("fftweaks.journals");
      if (!pack) {
        console.error("Compendium 'fftweaks.journals' not found.");
        return null;
      }
      return (await pack.getDocument("ij43IJbeKdTP3rJd")) as JournalEntry | null;
    }

    static async getClassSpells(className: string): Promise<string[]> {
      const journal = await this.getSpellJournal();
      if (!journal) return [];
      const pages = journal.pages.contents;
      const page = pages.find((p: any) => p.name === className);
      const rawSpells = page?.system?.spells;
      if (rawSpells instanceof Set) return Array.from(rawSpells);
      if (Array.isArray(rawSpells)) return rawSpells;
      return [];
    }

    static async refreshKnownSpells(character: Character) {
      if (!this._dialogHtml) return;
      const knownSpellNames = new Set(character.spells.map((spell: any) => spell.name.toLowerCase()));
      await this.updateSpellList(this._dialogHtml, knownSpellNames);
    }

    // New helper method to enforce the limit on new spell selections.
    static enforceChoiceLimit(html: JQuery, choicesNumber: number) {
      const checkboxes = html.find("#spell-list input[type='checkbox']");
      let newSelectionCount = 0;
      checkboxes.each((i, checkbox) => {
        const $cb = $(checkbox);
        // Check the data attribute to see if this spell was already known.
        const isKnown = $cb.attr("data-is-known") === "true";
        if (!isKnown && $cb.prop("checked")) {
          newSelectionCount++;
        }
      });
      checkboxes.each((i, checkbox) => {
        const $cb = $(checkbox);
        const isKnown = $cb.attr("data-is-known") === "true";
        if (!isKnown && !$cb.prop("checked")) {
          // If the number of new selections equals or exceeds the limit,
          // disable unchecked checkboxes for new spells.
          $cb.prop("disabled", newSelectionCount >= choicesNumber);
        }
      });
    }
  }
}
