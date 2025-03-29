namespace FFT {
  export class SpellSelector {
    private static _dialogHtml: JQuery | null = null;
    private static _initialKnownCount: number | null = null;

    /* ─── PUBLIC API ────────────────────────────────────────────────────────── */

    static renderButton(actor: Actor5e, html: JQuery<HTMLElement>) {
      const character = new Character(actor);
      const buttonHolder = html.find('.sheet-header-buttons');
      if (!buttonHolder.length || html.find("#fft-custom-button").length) return;

      const button = new FFT.CustomButton({
        id: "fft-spellselector-button",
        tooltip: "Spell Selector",
        iconClass: "fas fa-book-spells",
        onClick: () => this.renderDialog({ character })
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
        let dialogInstance: Dialog = new Dialog({
          title: "Spell Selector",
          content: content,
          buttons: {},
          render: (html: JQuery) => {
            this._dialogHtml = html;
            // Use Infinity if no choices provided.
            const choiceValue = choices === undefined ? Infinity : choices;
            this.initializeDialogEvents(html, character, dialogInstance, choiceValue);
          },
          close: () => resolve()
        });
        dialogInstance.render(true);
        Hooks.once("renderDialog", () => {
          const { width, height, left, top } = this.getDialogDimensions();
          dialogInstance.setPosition({ width, height, left, top });
        });
      });
    }

    static async addSpellsByName(character: Character, spellNames: string[]): Promise<void> {
      const knownSpellNames = new Set(character.spells.map(spell => String(spell.name).toLowerCase()));
      const spellsPack = game.packs.get("fftweaks.spells");
      if (!spellsPack) return;

      await spellsPack.getIndex();
      const documents = (await spellsPack.getDocuments()) as Item5e[];
      const toAdd: Item5e[] = [];
      let bonusChoices = 0;

      for (const name of spellNames) {
        const match = documents.find(spell => String(spell.name).toLowerCase() === name.toLowerCase());
        if (!match) continue;
        if (knownSpellNames.has(name.toLowerCase())) {
          bonusChoices += 1;
        } else {
          toAdd.push(match);
        }
      }

      if (toAdd.length) {
        await character.actor.createEmbeddedDocuments("Item", toAdd.map(item => item.toObject()));
      }

      if (bonusChoices > 0) {
        ui.notifications.info(`${bonusChoices} spell choice${bonusChoices > 1 ? "s" : ""} granted because they were already known.`);
      }
    }

    static async addAllSpellsByList(character: Character, list: string, level: number): Promise<void> {
      const spellIds = await this.getClassSpells(list);
      if (!spellIds.length) return;

      const matchingSpells: Item5e[] = [];
      for (const uuid of spellIds) {
        const item = await fromUuid(uuid) as Item5e | null;
        if (!item) continue;
        const itemLevel = item.system?.level ?? 0;
        if (itemLevel === level) {
          matchingSpells.push(item);
        }
      }
      if (!matchingSpells.length) return;

      const knownSpellNames = new Set(character.spells.map((spell: any) => String(spell.name).toLowerCase()));
      const newSpells = matchingSpells.filter(item =>
        !knownSpellNames.has(String(item.name).toLowerCase())
      );

      if (newSpells.length > 0) {
        await character.actor.createEmbeddedDocuments("Item", newSpells.map(item => item.toObject()));
      }
    }

    static async refreshKnownSpells(character: Character) {
      if (!this._dialogHtml) return;
      const knownSpellNames = new Set(character.spells.map((spell: any) => spell.name.toLowerCase()));
      await this.updateSpellList(this._dialogHtml, knownSpellNames);
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
      if (!pages.length) return null;

      const classSelectHTML = lockedFilter
        ? `<select id="spell-class" disabled><option value="${lockedFilter}">${lockedFilter}</option></select>`
        : `<select id="spell-class">${this.buildOptions(pages.map((p: any) => p.name))}</select>`;

      const rankSelectHTML = lockedRank !== undefined
        ? `<select id="spell-rank" disabled><option value="${lockedRank}">${this.getRankLabel(lockedRank)}</option></select>`
        : `<select id="spell-rank">${this.buildOptions([
          "All", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
        ], true)}</select>`;

      return `
        <div class="fft-dialog">
          ${this.getDialogStyle()}
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
                  <col />
                </colgroup>
                <tbody id="spell-list">
                  <tr><td colspan="5">Select a class to view spells</td></tr>
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

    /* ─── PRIVATE HELPER METHODS ────────────────────────────────────────────── */

    private static getDialogStyle(): string {
      return `
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
          .fft-dialog .data-table col:nth-child(1) {
            width: 50px;
          }
          .fft-dialog .data-table col:nth-child(2) {
            width: auto;
          }
          .fft-dialog .data-table col:nth-child(3),
          .fft-dialog .data-table col:nth-child(4),
          .fft-dialog .data-table col:nth-child(5) {
            width: 100px;
          }
          .fft-dialog .data-table tbody tr td {
            border: 1px solid #444;
            text-align: center;
            padding: 2px 4px;
            line-height: 1.0;
          }
          .fft-dialog .spell-name-cell {
            text-align: left !important;
            padding-left: 4px;
            cursor: pointer;
            text-decoration: underline;
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
    }

    private static buildOptions(options: string[], isRank: boolean = false): string {
      return options.map(option => {
        if (isRank && option !== "All") {
          return `<option value="${option}">${option === "0" ? "Cantrip" : option + (option === "1" ? "st" : option === "2" ? "nd" : option === "3" ? "rd" : "th")}</option>`;
        }
        return `<option value="${option}">${option}</option>`;
      }).join("");
    }

    private static getDialogDimensions() {
      const width = window.innerWidth * 0.375;
      const height = window.innerHeight * 0.8;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      return { width, height, left, top };
    }

    /* ─── EVENT HANDLING ───────────────────────────────────────────────────── */

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
      if (!classSelect.disabled) classSelect.addEventListener("change", updateHandler);
      if (!rankSelect.disabled) rankSelect.addEventListener("change", updateHandler);
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

    static updateChoicesInfo(html: JQuery, choicesNumber: number): void {
      if (choicesNumber === Infinity) {
        html.find("#choices-label").text("No limit on selections.");
        return;
      }
      const initialKnown = this._initialKnownCount || 0;
      const totalAllowed = initialKnown + choicesNumber;
      const currentChecked = html.find("#spell-list input[type='checkbox']:checked").length;
      const remaining = totalAllowed - currentChecked;
      html.find("#choices-label").text(`You can select up to ${remaining} spell${remaining !== 1 ? "s" : ""}`);
    }

    static enforceChoiceLimit(html: JQuery, choicesNumber: number) {
      if (choicesNumber === Infinity) return;
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

    static async addSelectedSpells(character: Character, html: JQuery, dialog: Dialog) {
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
        if (checkbox.checked) selectedSpellNames.push(spellName);
        if (character.spells.some(spell => (spell.name as string).toLowerCase() === lowerName)) {
          visibleKnownSpellNames.push(spellName);
        }
      });
      const namesToRemove = visibleKnownSpellNames.filter(name => !selectedSpellNames.includes(name));
      if (namesToRemove.length > 0) {
        await character.removeItemsByName(namesToRemove);
      }
      const knownSpellNames = new Set(character.spells.map(spell => (spell.name as string).toLowerCase()));
      const newSpellNames = selectedSpellNames.filter(name => !knownSpellNames.has(name.toLowerCase()));
      if (!newSpellNames.length) return;

      const spellsPack = game.packs.get("fftweaks.spells");
      if (!spellsPack) return;
      await spellsPack.getIndex();
      const documents = await spellsPack.getDocuments();
      const itemsToAdd = documents.filter(item => newSpellNames.includes(item.name));
      if (itemsToAdd.length > 0) {
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
        spellList.innerHTML = `<tr><td colspan="5">No spells found.</td></tr>`;
        return;
      }

      const spells = await Promise.all(
        spellIds.map(async (id) => {
          const item = await fromUuid(id) as any;
          if (!item) return null;
          const name = item.name;
          const level = item.system?.level ?? 0;
          const schoolAbbrev = item.system?.school ?? "";
          const school = schoolAbbrev ? this.getFullSchoolName(schoolAbbrev) : "";
          const range = this.getRangeString(item);
          return { name, level, school, range, uuid: id };
        })
      );
      const validSpells = spells.filter(sp => sp !== null);
      let filtered = validSpells.filter(sp => sp.name.toLowerCase().includes(nameFilter));
      if (selectedRank !== "All") {
        const numericRank = parseInt(selectedRank);
        filtered = filtered.filter(sp => sp.level === numericRank);
      }
      if (!filtered.length) {
        spellList.innerHTML = `<tr><td colspan="5">No spells found.</td></tr>`;
        return;
      }
      spellList.innerHTML = filtered.map(sp => {
        const isKnown = knownSpellNames.has(sp.name.toLowerCase());
        return `
          <tr>
            <td>
              <input type="checkbox" data-is-known="${isKnown}" ${isKnown ? "checked" : ""} />
            </td>
            <td class="spell-name-cell" data-uuid="${sp.uuid}">
              ${sp.name}
            </td>
            <td>${sp.level === 0 ? "Cantrip" : sp.level}</td>
            <td>${sp.school}</td>
            <td>${sp.range}</td>
          </tr>
        `;
      }).join("");

      // Attach click listener to open spell sheets.
      html.find(".spell-name-cell").off("click").on("click", async function () {
        const uuid = $(this).data("uuid");
        if (!uuid) return;
        const item = await fromUuid(uuid);
        if (item instanceof Item) item.sheet.render(true);
      });
    }

    /**
     * Returns the full spell school name given an abbreviation.
     */
    static getFullSchoolName(abbrev: string): string {
      const map: Record<string, string> = {
        "abj": "Abjuration",
        "con": "Conjuration",
        "div": "Divination",
        "enc": "Enchantment",
        "evo": "Evocation",
        "ill": "Illusion",
        "nec": "Necromancy",
        "trs": "Transmutation"
      };
      const key = abbrev.toLowerCase();
      return map[key] || (abbrev.charAt(0).toUpperCase() + abbrev.slice(1));
    }

    /**
     * Returns a string representing the spell's range.
     * It first checks for a long description. If none exists, it attempts to determine if the spell
     * is Self or Touch based on the value and units.
     */
    static getRangeString(item: any): string {
      const rng = item.system?.range;
      if (!rng) return "";
      // If a long description exists and is non-empty, use it.
      if (rng.long && rng.long.trim().length > 0) {
        return rng.long;
      }
      // If the value is null, try to use the type or units as a fallback.
      if (rng.value === null) {
        if (rng.type) {
          return rng.type.charAt(0).toUpperCase() + rng.type.slice(1);
        }
        if (rng.units && rng.units.trim().length > 0) {
          return rng.units.charAt(0).toUpperCase() + rng.units.slice(1);
        }
      }
      // If the value is 0 and units is provided and not the typical numeric range ("ft"),
      // assume it represents a special range like Self or Touch.
      if (rng.value === 0 && rng.units && rng.units.toLowerCase() !== "ft") {
        return rng.units.charAt(0).toUpperCase() + rng.units.slice(1);
      }
      // Otherwise, return the numeric range.
      if (rng.value !== undefined && rng.value !== null && rng.units) {
        return `${rng.value} ${rng.units}`;
      }
      return "";
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
  }
}
