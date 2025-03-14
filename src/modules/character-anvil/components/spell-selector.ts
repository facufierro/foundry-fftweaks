namespace FFT {
  export class SpellSelector {
    static async showSpellDialog() {
      // Load class names from the Spell Journal
      const journal = await this.getSpellJournal();
      if (!journal) return;
      const pages = (journal as JournalEntry).pages.contents || [];
      if (!pages.length) {
        ui.notifications.warn("No pages found in the Spell Journal.");
        return;
      }
      const classNames = pages.map((p: any) => p.name);

      // Default filter values
      let selectedClass = classNames[0] || "";
      let selectedRank = "All";
      let nameFilter = "";

      // Ranks from Cantrip(0) to 9th
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
      // Class options
      const classOptions = classNames
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("");

      // Build the HTML content
      const content = `
        <div class="fft-dialog">
          <style>
            /* Container fills the dialog */
            .fft-dialog .fft-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
            }

            /* Filter row: fixed at 40px tall, always visible */
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
            .fft-dialog .filter-row label {
              white-space: nowrap;
            }
            .fft-dialog .filter-row input,
            .fft-dialog .filter-row select {
              height: 24px;
              margin-left: 4px;
              margin-right: 8px;
              background: transparent;
              color: #fff;
              border: 1px solid #444;
              padding: 0 4px;
            }
            /* Style placeholders to match label color */
            .fft-dialog .filter-row input::placeholder {
              color: #fff;
              opacity: 1;
            }
            .fft-dialog .filter-row input::-webkit-input-placeholder {
              color: #fff;
            }
            .fft-dialog .filter-row input::-moz-placeholder {
              color: #fff;
            }
            .fft-dialog .filter-row input:-ms-input-placeholder {
              color: #fff;
            }

            /* Scrollable data container in the middle */
            .fft-dialog .data-container {
              flex: 1;
              overflow: auto;
            }

            /* Table for the spell data (no header row) */
            .fft-dialog .data-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 0.9em;
            }
            /* Column widths:
               1) 50px (checkbox)
               2) auto (name)
               3) 100px (level)
               4) 100px (range)
            */
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

            /* Button row: fixed at bottom, always visible */
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
            <!-- Filter Row -->
            <div class="filter-row">
              <label for="spell-name-filter">Name:</label>
              <input type="text" id="spell-name-filter" placeholder="Find spell..." />
              <label for="spell-class">Class:</label>
              <select id="spell-class">${classOptions}</select>
              <label for="spell-rank">Rank:</label>
              <select id="spell-rank">${rankOptions}</select>
            </div>

            <!-- Scrollable Data Container -->
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

            <!-- Button Row -->
            <div class="button-row">
              <button id="accept-btn" type="button">Accept</button>
            </div>
          </div>
        </div>
      `;

      // Create the Foundry dialog
      const dialog = new Dialog({
        title: "Spell Selector",
        content,
        buttons: {},
        render: async (html) => {
          // Grab filter inputs and button
          const nameInput = html[0].querySelector("#spell-name-filter") as HTMLInputElement;
          const classSelect = html[0].querySelector("#spell-class") as HTMLSelectElement;
          const rankSelect = html[0].querySelector("#spell-rank") as HTMLSelectElement;
          const spellList = html[0].querySelector("#spell-list") as HTMLTableSectionElement;
          const acceptBtn = html[0].querySelector("#accept-btn") as HTMLButtonElement;

          // Update spell list when filters change
          nameInput.addEventListener("input", updateSpellList);
          classSelect.addEventListener("change", updateSpellList);
          rankSelect.addEventListener("change", updateSpellList);

          // Close dialog on Accept
          acceptBtn.addEventListener("click", () => dialog.close());

          // Initial load of spells
          await updateSpellList();

          async function updateSpellList() {
            nameFilter = nameInput.value.toLowerCase().trim();
            selectedClass = classSelect.value;
            selectedRank = rankSelect.value;

            // Get spells for the chosen class
            const spellIds = await SpellSelector.getClassSpells(selectedClass);

            // Ensure the spells compendium is indexed
            const spellsPack = game.packs.get("fftweaks.spells");
            if (spellsPack) await spellsPack.getIndex();

            if (!spellIds.length) {
              spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
              return;
            }

            // Load each spell
            const spells = await Promise.all(
              spellIds.map(async (id) => {
                const item = await fromUuid(id) as any;
                if (!item) return null;
                const name = item.name;
                const level = item.system?.level ?? 0;
                const range = getRangeString(item);
                return { name, level, range };
              })
            );

            const validSpells = spells.filter(s => s);
            // Filter by name
            let filtered = validSpells.filter(sp => sp.name.toLowerCase().includes(nameFilter));
            // Filter by rank if not "All"
            if (selectedRank !== "All") {
              const numericRank = parseInt(selectedRank);
              filtered = filtered.filter(sp => sp.level === numericRank);
            }

            if (!filtered.length) {
              spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
              return;
            }

            // Render spell rows
            spellList.innerHTML = filtered.map(sp => `
              <tr>
                <td><input type="checkbox" /></td>
                <td class="spell-name-cell">${sp.name}</td>
                <td>${sp.level === 0 ? "Cantrip" : sp.level}</td>
                <td>${sp.range}</td>
              </tr>
            `).join("");
          }

          function getRangeString(item: any): string {
            const rng = item.system?.range;
            if (!rng) return "";
            if (rng.value && rng.units) return `${rng.value} ${rng.units}`;
            return rng.long ?? rng.value ?? "";
          }
        }
      });

      dialog.render(true);
      // Center and size the dialog at 75% width, 80% height
      Hooks.once("renderDialog", () => {
        const w = window.innerWidth * 0.75;
        const h = window.innerHeight * 0.8;
        const left = (window.innerWidth - w) / 2;
        const top = (window.innerHeight - h) / 2;
        dialog.setPosition({ width: w, height: h, left, top });
      });
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
      const pages = (journal as JournalEntry).pages.contents;
      const page = pages.find((p: any) => p.name === className);
      const rawSpells = page?.system?.spells;
      if (rawSpells instanceof Set) return Array.from(rawSpells);
      if (Array.isArray(rawSpells)) return rawSpells;
      return [];
    }
  }
}
