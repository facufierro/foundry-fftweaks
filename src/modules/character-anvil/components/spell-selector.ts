namespace FFT {
  export class SpellSelector {
    // Store a reference to the dialog's root element for later updates.
    private static _dialogHtml: JQuery | null = null;

    static async showDialog(character: Character) {
      const journal = await this.getSpellJournal();
      if (!journal) return;
      const content = this.buildDialogContent(journal);
      if (!content) return;

      let dialogInstance: Dialog;
      dialogInstance = new Dialog({
        title: "Spell Selector",
        content: content,
        buttons: {},
        render: (html: JQuery) => {
          // Save the dialog's HTML element so we can update it later.
          this._dialogHtml = html;
          this.initializeDialogEvents(html, character, dialogInstance);
        }
      });
      dialogInstance.render(true);

      // Center and size the dialog.
      Hooks.once("renderDialog", () => {
        const w = window.innerWidth * 0.75;
        const h = window.innerHeight * 0.8;
        const left = (window.innerWidth - w) / 2;
        const top = (window.innerHeight - h) / 2;
        dialogInstance.setPosition({ width: w, height: h, left, top });
      });
    }

    // Builds the HTML content for the dialog.
    static buildDialogContent(journal: JournalEntry): string | null {
      const pages = journal.pages.contents || [];
      if (!pages.length) {
        ui.notifications.warn("No pages found in the Spell Journal.");
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
      const classOptions = classNames
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("");

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
            .fft-dialog .data-table tbody tr.known-spell {
              background: #444;
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

    static initializeDialogEvents(html: JQuery, character: Character, dialog: Dialog) {
      const nameInput = html[0].querySelector("#spell-name-filter") as HTMLInputElement;
      const classSelect = html[0].querySelector("#spell-class") as HTMLSelectElement;
      const rankSelect = html[0].querySelector("#spell-rank") as HTMLSelectElement;
      const acceptBtn = html[0].querySelector("#accept-btn") as HTMLButtonElement;

      const updateHandler = () => this.refreshKnownSpells(character);

      nameInput.addEventListener("input", updateHandler);
      classSelect.addEventListener("change", updateHandler);
      rankSelect.addEventListener("change", updateHandler);
      acceptBtn.addEventListener("click", () => dialog.close());

      updateHandler(); // initial render
    }


    // Updates the spell list using the current filters and marks known spells.
    static async updateSpellList(html: JQuery, knownSpellNames: Set<string>) {
      const nameInput = html[0].querySelector("#spell-name-filter") as HTMLInputElement;
      const classSelect = html[0].querySelector("#spell-class") as HTMLSelectElement;
      const rankSelect = html[0].querySelector("#spell-rank") as HTMLSelectElement;
      const spellList = html[0].querySelector("#spell-list") as HTMLTableSectionElement;

      const nameFilter = nameInput.value.toLowerCase().trim();
      const selectedClass = classSelect.value;
      const selectedRank = rankSelect.value;

      // Get spell IDs for the selected class.
      const spellIds = await this.getClassSpells(selectedClass);
      const spellsPack = game.packs.get("fftweaks.spells");
      if (spellsPack) await spellsPack.getIndex();

      if (!spellIds.length) {
        spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
        return;
      }

      // Load spell details.
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

      // Apply filters.
      let filtered = validSpells.filter(sp => sp.name.toLowerCase().includes(nameFilter));
      if (selectedRank !== "All") {
        const numericRank = parseInt(selectedRank);
        filtered = filtered.filter(sp => sp.level === numericRank);
      }

      if (!filtered.length) {
        spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
        return;
      }

      // Render spell rows, marking known spells.
      spellList.innerHTML = filtered.map(sp => {
        const isKnown = knownSpellNames.has(sp.name.toLowerCase());
        return `
          <tr class="${isKnown ? 'known-spell' : ''}">
            <td>
              <input type="checkbox" ${isKnown ? "checked disabled" : ""} />
            </td>
            <td class="spell-name-cell">${sp.name}</td>
            <td>${sp.level === 0 ? "Cantrip" : sp.level}</td>
            <td>${sp.range}</td>
          </tr>
        `;
      }).join("");
    }

    // Helper: returns a formatted range string for a spell.
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

    /**
     * Refreshes the known spells in the dialog.
     * If a spellName is provided, toggles its "known" state in the set
     * before updating the dialog.
     */
    static async refreshKnownSpells(character: Character) {
      if (!this._dialogHtml) return;

      const knownSpellNames = new Set(character.spells.map((spell: any) => spell.name.toLowerCase()));
      await this.updateSpellList(this._dialogHtml, knownSpellNames);
    }

  }

}
