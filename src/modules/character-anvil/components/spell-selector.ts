namespace FFT.Modules {
    export class SpellSelector {
        static isValidEvent(userId: string): boolean {
            return game.user.isGM || userId === game.user.id;
        }

        static async showDialog(spells: Record<string, string>, userId: string): Promise<void> {
            if (!this.isValidEvent(userId)) return;
            if (Object.keys(spells).length === 0) return;

            // Generate checkboxes for each spell name, keeping IDs hidden
            const spellOptions = Object.entries(spells).map(([spellName, spellId]) => `
                <div>
                    <input type="checkbox" class="spell-checkbox" data-spell-id="${spellId}">
                    <label>${spellName}</label>
                </div>
            `).join("");

            const content = `
                <p>Select spells to add:</p>
                <div class="spell-list" style="max-height: 400px; overflow-y: auto;">
                    ${spellOptions}
                </div>
            `;

            new FF.CustomDialog(
                "Add Spells",
                content,
                {
                    yes: {
                        label: "Add",
                        callback: async (html: JQuery<HTMLElement>) => {
                            const selectedSpells = Array.from(
                                html[0].querySelectorAll<HTMLInputElement>(".spell-checkbox:checked")
                            ).map(el => el.dataset.spellId || "");

                            if (selectedSpells.length === 0) {
                                ui.notifications.warn("No spells selected.");
                                return;
                            }

                            console.log("Selected Spell IDs:", selectedSpells);
                            ui.notifications.info(`${selectedSpells.length} spell(s) selected.`);
                        }
                    },
                    no: {
                        label: "Cancel",
                        callback: () => ui.notifications.info(`Spell selection canceled.`)
                    }
                },
                "yes"
            ).render();
        }



        static async getSpellData(spellListId: string): Promise<Record<string, string>> {
            console.log("Received spellListId:", spellListId);

            const [journalId, pageId] = spellListId.split(".");
            console.log("Extracted Journal ID:", journalId);
            console.log("Extracted Page ID:", pageId);

            const journal = game.journal.get(journalId);
            if (!journal) return {};

            const page = journal.pages.get(pageId);
            if (!page) return {};

            console.log("Journal Page Found:", page.name);
            console.log("Page System Data:", page.system);

            // Convert the spell list (Set or Array) into an array
            const spellIds: string[] = page.system?.spells instanceof Set
                ? Array.from(page.system.spells)
                : Array.isArray(page.system?.spells)
                    ? page.system.spells
                    : [];

            console.log("Extracted Spell IDs:", spellIds);

            if (spellIds.length === 0) {
                console.warn(`No spells found in Journal Page: ${page.name}`);
                return {};
            }

            // Convert to dictionary { spellName: spellId }
            const spellDict: Record<string, string> = Object.fromEntries(
                await Promise.all(spellIds.map(async id => {
                    const spell = await fromUuid(id);
                    return spell instanceof Item ? [spell.name, id] : null;
                })).then(spells => spells.filter(Boolean))
            );

            console.log("Final Spell Dictionary:", spellDict);
            return spellDict;
        }

    }
}
