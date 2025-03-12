namespace FFT.Modules {
    export class SpellSelector {
        static isValidEvent(userId: string): boolean {
            return game.user.isGM || userId === game.user.id;
        }

        static async getSpellData(spellListId: string): Promise<{ spells: Record<string, { id: string, level: number }>, title: string, category: string }> {
            console.log("Received spellListId:", spellListId);

            const [journalId, pageId] = spellListId.split(".");
            console.log("Extracted Journal ID:", journalId);
            console.log("Extracted Page ID:", pageId);

            const journal = game.journal.get(journalId);
            if (!journal) return { spells: {}, title: "Unknown", category: "Spells" };

            const page = journal.pages.get(pageId);
            if (!page) return { spells: {}, title: "Unknown", category: "Spells" };

            console.log("Journal Page Found:", page.name);
            console.log("Page System Data:", page.system);

            const spellIds: string[] = page.system?.spells instanceof Set
                ? Array.from(page.system.spells)
                : Array.isArray(page.system?.spells)
                    ? page.system.spells
                    : [];

            console.log("Extracted Spell IDs:", spellIds);

            if (spellIds.length === 0) {
                console.warn(`No spells found in Journal Page: ${page.name}`);
                return {
                    spells: {},
                    title: page.name,
                    category: String(page.system?.grouping || "Spells")
                };
            }

            // Convert to dictionary { spellName: { id, level } }
            const spellDict: Record<string, { id: string, level: number }> = Object.fromEntries(
                await Promise.all(spellIds.map(async id => {
                    const spell = await fromUuid(id);
                    return spell instanceof Item ? [spell.name, { id: id, level: spell.system.level || 0 }] : null;
                })).then(spells => spells.filter(Boolean))
            );

            console.log("Final Spell Dictionary:", spellDict);
            return {
                spells: spellDict,
                title: page.name,
                category: String(page.system?.grouping || "Spells")
            };
        }

        static async showDialog(
            spells: Record<string, { id: string, level: number }>,
            title: string,
            category: string,
            actor: Actor, // ✅ Actor is now passed in
            userId: string
        ): Promise<void> {
            if (!this.isValidEvent(userId)) return;
            if (Object.keys(spells).length === 0) return;
            if (!actor) {
                ui.notifications.error("No character sheet found.");
                return;
            }

            const existingSpells = this.getExistingSpells(actor); // ✅ Use the actor to check existing spells

            // Group spells by level
            const spellsByLevel: Record<number, { name: string, id: string, owned: boolean }[]> = {};

            for (const [spellName, spellData] of Object.entries(spells)) {
                const level = spellData.level;
                if (!spellsByLevel[level]) spellsByLevel[level] = [];

                spellsByLevel[level].push({
                    name: spellName,
                    id: spellData.id,
                    owned: existingSpells.has(spellName) // ✅ Check if the character already owns this spell
                });
            }

            // Sort levels numerically
            const sortedLevels = Object.keys(spellsByLevel)
                .map(Number)
                .sort((a, b) => a - b);

            // Build spell selection UI with level separators
            const spellOptions = sortedLevels.map(level => {
                const levelLabel = level === 0 ? "Cantrips" : `Level ${level}`;
                const spellList = spellsByLevel[level]
                    .map(spell => `
                        <div>
                            <input type="checkbox" class="spell-checkbox" data-spell-id="${spell.id}" ${spell.owned ? "disabled" : ""}>
                            <label style="${spell.owned ? "color: gray;" : ""}">${spell.name}</label>
                        </div>
                    `).join("");

                return `
                    <h3>${levelLabel}</h3>
                    ${spellList}
                `;
            }).join("");

            const content = `
                <p><strong>${category}</strong></p>  <!-- ✅ Display spell category -->
                <div class="spell-list" style="max-height: 400px; overflow-y: auto;">
                    ${spellOptions}
                </div>
            `;

            new FF.CustomDialog(
                title,
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


        static getExistingSpells(actor: Actor): Set<string> {
            if (!actor) return new Set();

            // Get all spell names from the actor's items
            const spellNames = new Set(
                actor.items.filter(item => item.type === "spell").map(spell => spell.name)
            );

            console.log("Existing Spells on Character:", spellNames);
            return spellNames;
        }

    }
}
