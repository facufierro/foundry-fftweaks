namespace FFT {
  export class SpellSelector {
    private static _dialogHtml: JQuery | null = null;
    private static _initialKnownCount: number | null = null;

    static renderButton(actor: Actor5e, html: JQuery<HTMLElement>) {
      const character = new Character(actor);
      const buttonHolder = html.find('.sheet-header-buttons');
      if (!buttonHolder.length || html.find("#fft-custom-button").length) return;
      const button = new FFT.CustomButton({
        id: "fft-spellselector-button",
        tooltip: "Spell Selector",
        iconClass: "fas fa-book-spells",
        onClick: () => {
          this.renderDialog({ character });
        }
      });
      button.appendTo(buttonHolder);
    }

    static async renderDialog({ character, list, level, choices }: { character: Character; choices?: number; list?: string; level?: number; }): Promise<void> {
      const journal = await this.getSpellJournal();
      if (!journal) return;
      const content = this.buildDialogContent(journal, list, level, choices);
      if (!content) return;
      this._initialKnownCount = null;
      return new Promise<void>((resolve) => {
        let dialogInstance: Dialog;
        dialogInstance = new Dialog({
          title: "Spell Selector",
          content: content,
          buttons: {},
          render: (html: JQuery) => {
            this._dialogHtml = html;
            this.initializeDialogEvents(html, character, dialogInstance, choices || 0);
          },
          close: () => {
            resolve();
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

    static getRankLabel(rank: number): string {
      if (rank === 0) return "Cantrips";
      if (rank === 1) return "1st Level";
      if (rank === 2) return "2nd Level";
      if (rank === 3) return "3rd Level";
      return rank + "th Level";
    }

    static buildDialogContent(journal: JournalEntry, lockedFilter?: string, lockedRank?: number, choices?: number): string | null {
      const pages = journal.pages.contents || [];
      if (!pages.length) {
        return null;
      }
      let classSelectHTML: string;
      if (lockedFilter) {
        classSelectHTML = `<select id="spell-class" disabled><option value="${lockedFilter}">${lockedFilter}</option></select>`;
      } else {
        const classNames = pages.map((p: any) => p.name);
        const classOptions = classNames.map((c) => `<option value="${c}">${c}</option>`).join("");
        classSelectHTML = `<select id="spell-class">${classOptions}</select>`;
      }
      let rankSelectHTML: string;
      if (lockedRank !== undefined) {
        rankSelectHTML = `<select id="spell-rank" disabled>
                              <option value="${lockedRank}">${this.getRankLabel(lockedRank)}</option>
                            </select>`;
      } else {
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
        rankSelectHTML = `<select id="spell-rank">${rankOptions}</select>`;
      }
      return `
          <div class="fft-dialog">
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
              .fft-dialog .choices-row {
                text-align: center;
                padding: 4px;
                background: #333;
                color: #fff;
                font-weight: bold;
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
              <div class="header">
                <div class="filter-row">
                  <label for="spell-name-filter">Name:</label>
                  <input type="text" id="spell-name-filter" placeholder="Find spell..." />
                  <label for="spell-class">Class:</label>
                  ${classSelectHTML}
                  <label for="spell-rank">Rank:</label>
                  ${rankSelectHTML}
                </div>
                ${choices !== undefined ? `<div class="choices-row"><span id="choices-label"></span></div>` : ""}
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

    static updateChoicesInfo(html: JQuery, choicesNumber: number) {
      const initialKnown = this._initialKnownCount || 0;
      const totalAllowed = initialKnown + choicesNumber;
      const currentChecked = html.find("#spell-list input[type='checkbox']:checked").length;
      const remaining = totalAllowed - currentChecked;
      html.find("#choices-label").text(`You can select up to ${remaining} spell${remaining !== 1 ? "s" : ""}`);
    }

    static initializeDialogEvents(html: JQuery, character: Character, dialog: Dialog, choicesNumber: number) {
      const nameInput = html[0].querySelector("#spell-name-filter") as HTMLInputElement;
      const classSelect = html[0].querySelector("#spell-class") as HTMLSelectElement;
      const rankSelect = html[0].querySelector("#spell-rank") as HTMLSelectElement;
      const acceptBtn = html[0].querySelector("#accept-btn") as HTMLButtonElement;
      const updateHandler = () => {
        this.refreshKnownSpells(character).then(() => {
          if (this._initialKnownCount === null) {
            this._initialKnownCount = html.find("#spell-list input[data-is-known='true']").length;
          }
          this.enforceChoiceLimit(html, choicesNumber);
          this.updateChoicesInfo(html, choicesNumber);
        });
      };
      nameInput.addEventListener("input", updateHandler);
      if (!classSelect.disabled) {
        classSelect.addEventListener("change", updateHandler);
      }
      if (!rankSelect.disabled) {
        rankSelect.addEventListener("change", updateHandler);
      }
      acceptBtn.addEventListener("click", async () => {
        await this.addSelectedSpells(character, html, dialog);
        dialog.close();
      });
      html.find("#spell-list").on("change", "input[type='checkbox']", () => {
        this.enforceChoiceLimit(html, choicesNumber);
        this.updateChoicesInfo(html, choicesNumber);
      });
      updateHandler();
    }

    static enforceChoiceLimit(html: JQuery, choicesNumber: number) {
      const initialKnown = this._initialKnownCount || 0;
      const totalAllowed = initialKnown + choicesNumber;
      const currentChecked = html.find("#spell-list input[type='checkbox']:checked").length;
      html.find("#spell-list input[type='checkbox']").each((i, checkbox) => {
        const $cb = $(checkbox);
        if (!$cb.prop("checked")) {
          $cb.prop("disabled", currentChecked >= totalAllowed);
        }
      });
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
      const namesToRemove = visibleKnownSpellNames.filter(name =>
        !selectedSpellNames.includes(name)
      );
      if (namesToRemove.length > 0) {
        await character.removeItemsByName(namesToRemove);
      }
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
      const page = pages.find((p: any) => p.name.toLowerCase() === className.toLowerCase());
      const rawSpells = page?.system?.spells;
      if (rawSpells instanceof Set) return Array.from(rawSpells);
      if (Array.isArray(rawSpells)) return rawSpells;
      return [];
    }
    static async giveAllSpells(character: Character, list: string, level: number): Promise<void> {
      const spellIds = await this.getClassSpells(list);
      if (!spellIds.length) return;
      const spellsPack = game.packs.get("fftweaks.spells");
      if (!spellsPack) return;
      await spellsPack.getIndex();
      const documents = (await spellsPack.getDocuments()) as Item5e[];
      const spellsToAdd = documents.filter((item: Item5e) => (item.system.level ?? 0) === level);
      if (!spellsToAdd.length) return;
      const knownSpellNames = new Set(character.spells.map((spell: any) => String(spell.name).toLowerCase()));
      const newSpells = spellsToAdd.filter((item: any) => !knownSpellNames.has(String(item.name).toLowerCase()));
      if (newSpells.length > 0) {
        await character.actor.createEmbeddedDocuments("Item", newSpells.map((item: any) => item.toObject()));
      }
    }

    static async refreshKnownSpells(character: Character) {
      if (!this._dialogHtml) return;
      const knownSpellNames = new Set(character.spells.map((spell: any) => spell.name.toLowerCase()));
      await this.updateSpellList(this._dialogHtml, knownSpellNames);
    }
  }
}
