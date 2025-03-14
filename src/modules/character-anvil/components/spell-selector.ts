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

            // Rank options from Cantrip (0) to 9th
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

            // Provide a simple host container for our shadow root.
            const content = `<div id="shadow-host"></div>`;

            const dialog = new Dialog({
                title: "Spell Selector",
                content,
                buttons: {},
                render: async (html) => {
                    // Attach a shadow root to the host div
                    const host = html[0].querySelector("#shadow-host");
                    if (!host) return;
                    const shadow = host.attachShadow({ mode: "open" });

                    // Now insert our full dialog content into the shadow root.
                    shadow.innerHTML = `
              <style>
                /* Reset inherited styles */
                :host { all: initial; }
                /* Container: use flex layout with three rows */
                .fft-container {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  font-size: 0.9em;
                  font-family: sans-serif;
                }
                /* Filter row (unchanged height) */
                .filter-row {
                  flex: 0 0 40px;
                  display: flex;
                  align-items: center;
                  padding: 0 8px;
                  box-sizing: border-box;
                }
                .filter-row label {
                  white-space: nowrap;
                }
                .filter-row input,
                .filter-row select {
                  height: 24px;
                  margin-left: 4px;
                  margin-right: 8px;
                }
                /* Data container: scrollable */
                .data-container {
                  flex: 1;
                  overflow-y: auto;
                  padding-bottom: 40px; /* extra space for button row */
                }
                /* Data table styling */
                .data-table {
                  width: 100%;
                  border-collapse: collapse;
                  table-layout: fixed;
                }
                /* Column widths:
                   1) Checkbox: 50px,
                   2) Name: auto,
                   3) Level: 100px,
                   4) Range: 100px.
                */
                .data-table col:nth-child(1) { width: 50px; }
                .data-table col:nth-child(2) { width: auto; }
                .data-table col:nth-child(3) { width: 100px; }
                .data-table col:nth-child(4) { width: 100px; }
                .data-table tbody tr td {
                  border: 1px solid #444;
                  text-align: center;
                  padding: 2px 4px;
                  line-height: 1.0;
                }
                .spell-name-cell {
                  text-align: left !important;
                  padding-left: 4px;
                }
                /* Button row: fixed at bottom */
                .button-row {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  height: 40px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  background: #222;
                }
                #accept-btn {
                  width: 100px;
                  height: 28px;
                }
                /* Ensure the host fills available space */
                .host-wrapper {
                  position: relative;
                  width: 100%;
                  height: 100%;
                }
              </style>
              <div class="host-wrapper">
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
                  <!-- Data Container -->
                  <div class="data-container">
                    <table class="data-table">
                      <colgroup>
                        <col>
                        <col>
                        <col>
                        <col>
                      </colgroup>
                      <tbody id="spell-list">
                        <tr><td colspan="4" style="text-align:center;">Select a class to view spells</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <!-- Button Row (always visible) -->
                <div class="button-row">
                  <button id="accept-btn" type="button">Accept</button>
                </div>
              </div>
            `;

                    // Now that our shadow DOM is in place, grab elements from within it.
                    const nameInput = shadow.querySelector("#spell-name-filter") as HTMLInputElement;
                    const classSelect = shadow.querySelector("#spell-class") as HTMLSelectElement;
                    const rankSelect = shadow.querySelector("#spell-rank") as HTMLSelectElement;
                    const spellList = shadow.querySelector("#spell-list") as HTMLTableSectionElement;
                    const acceptBtn = shadow.querySelector("#accept-btn") as HTMLButtonElement;

                    nameInput.addEventListener("input", updateSpellList);
                    classSelect.addEventListener("change", updateSpellList);
                    rankSelect.addEventListener("change", updateSpellList);
                    acceptBtn.addEventListener("click", () => dialog.close());

                    await updateSpellList();

                    async function updateSpellList() {
                        nameFilter = nameInput.value.toLowerCase().trim();
                        selectedClass = classSelect.value;
                        selectedRank = rankSelect.value;

                        // Retrieve spell IDs for the selected class.
                        const spellIds = await SpellSelector.getClassSpells(selectedClass);

                        // Ensure the spells compendium is indexed.
                        const spellsPack = game.packs.get("fftweaks.spells");
                        if (spellsPack) await spellsPack.getIndex();

                        if (!spellIds.length) {
                            spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
                            return;
                        }

                        // Load spells asynchronously.
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
                        let filtered = validSpells.filter(sp => sp.name.toLowerCase().includes(nameFilter));
                        if (selectedRank !== "All") {
                            const numericRank = parseInt(selectedRank);
                            filtered = filtered.filter(sp => sp.level === numericRank);
                        }
                        if (!filtered.length) {
                            spellList.innerHTML = `<tr><td colspan="4">No spells found.</td></tr>`;
                            return;
                        }
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
