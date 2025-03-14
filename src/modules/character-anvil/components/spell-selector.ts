namespace FFT {
    export class SpellSelector {
        static async showSpellDialog() {
            console.log("[FFTweaks] showSpellDialog() called");
            const journal = await this.getSpellJournal();
            if (!journal) return;

            // Retrieve pages as an array from the embedded collection
            const pages = (journal as JournalEntry).pages.contents;
            console.log("[FFTweaks] Journal Pages:", pages);
            if (!pages || pages.length === 0) {
                ui.notifications.warn("No pages found in the journal.");
                return;
            }

            // Build the class dropdown from all page names
            const classNames = pages.map((p: any) => p.name);
            console.log("[FFTweaks] Class Names:", classNames);
            let selectedClass = classNames[0] || "";
            let selectedRank = "All";

            const content = `<form>
          <div class="form-group">
            <label>Class</label>
            <select id="spell-class">
              ${classNames.map((c: string) => `<option value="${c}">${c}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Rank</label>
            <select id="spell-rank">
              <option value="All">All</option>
            </select>
          </div>
          <div class="form-group">
            <label>Spells</label>
            <div id="spell-list">Select a class to view spells</div>
          </div>
        </form>`;

            new Dialog({
                title: "Spell Selector",
                content,
                buttons: { close: { label: "Close" } },
                render: async (html) => {
                    console.log("[FFTweaks] Dialog rendered");
                    const classDropdown = html[0].querySelector("#spell-class") as HTMLSelectElement;
                    const rankDropdown = html[0].querySelector("#spell-rank") as HTMLSelectElement;
                    const spellListDiv = html[0].querySelector("#spell-list") as HTMLDivElement;

                    async function updateSpellList() {
                        selectedClass = classDropdown.value;
                        console.log(`[FFTweaks] Selected class: ${selectedClass}`);
                        const spellIds = await FFT.SpellSelector.getClassSpells(selectedClass);
                        console.log(`[FFTweaks] Spell IDs for ${selectedClass}:`, spellIds);

                        // Load spells compendium index so fromUuid works properly
                        const spellsPack = game.packs.get("fftweaks.spells");
                        if (spellsPack) {
                            await spellsPack.getIndex();
                            console.log("[FFTweaks] Spells compendium index loaded.");
                        } else {
                            console.error("[FFTweaks] Spells compendium not found.");
                        }

                        if (!spellIds.length) {
                            console.log("[FFTweaks] No spell IDs found for selected class.");
                            spellListDiv.innerHTML = `<p>No spells found.</p>`;
                            return;
                        }

                        // Fetch each spell's details via fromUuid()
                        const spellDetails = await Promise.all(
                            spellIds.map(async (spellId: string) => {
                                try {
                                    console.log("[FFTweaks] Loading spell with ID:", spellId);
                                    const spell = await fromUuid(spellId) as any;
                                    if (!spell) {
                                        console.warn("[FFTweaks] Spell not found for ID:", spellId);
                                        return null;
                                    }
                                    console.log("[FFTweaks] Loaded spell:", spell);
                                    return { name: spell.name, level: Number(spell.system?.level) || 0 };
                                } catch (err) {
                                    console.error("[FFTweaks] Error loading spell:", spellId, err);
                                    return null;
                                }
                            })
                        );
                        const validSpells = spellDetails.filter(s => s) as Array<{ name: string; level: number }>;
                        console.log("[FFTweaks] Valid Spells:", validSpells);

                        // Build unique levels for the rank dropdown
                        const uniqueLevels = [...new Set(validSpells.map(s => s.level))].sort((a, b) => a - b);
                        console.log("[FFTweaks] Unique Spell Levels:", uniqueLevels);
                        rankDropdown.innerHTML = `<option value="All">All</option>`;
                        uniqueLevels.forEach(level => {
                            rankDropdown.innerHTML += `<option value="${level}">Level ${level}</option>`;
                        });

                        function renderSpells() {
                            let filtered = validSpells;
                            if (selectedRank !== "All") {
                                filtered = filtered.filter(s => s.level === parseInt(selectedRank));
                            }
                            console.log("[FFTweaks] Rendering spells:", filtered);
                            spellListDiv.innerHTML = filtered.length
                                ? filtered.map(s => `<p>Level ${s.level}: ${s.name}</p>`).join("")
                                : `<p>No spells found.</p>`;
                        }
                        renderSpells();
                        rankDropdown.onchange = () => {
                            selectedRank = rankDropdown.value;
                            console.log("[FFTweaks] Selected Rank:", selectedRank);
                            renderSpells();
                        };
                    }
                    classDropdown.onchange = updateSpellList;
                    await updateSpellList();
                }
            }).render(true);
        }

        static async getSpellJournal(): Promise<JournalEntry | null> {
            const pack = game.packs.get("fftweaks.journals");
            if (!pack) {
                console.error("[FFTweaks] Compendium 'fftweaks.journals' not found.");
                return null;
            }
            const journal = await pack.getDocument("ij43IJbeKdTP3rJd") as JournalEntry | null;
            console.log("[FFTweaks] Loaded Journal:", journal);
            return journal;
        }

        static async getClassSpells(className: string): Promise<string[]> {
            const journal = await this.getSpellJournal();
            if (!journal) return [];
            const pages = (journal as JournalEntry).pages.contents;
            const page = pages.find((p: any) => p.name === className);
            console.log(`[FFTweaks] Page for ${className}:`, page);
            // Get spells from page.system.spells; if it's a Set, convert it to an array.
            const spells = page?.system?.spells;
            console.log(`[FFTweaks] Raw spells for ${className}:`, spells);
            if (spells instanceof Set) {
                return Array.from(spells);
            } else if (Array.isArray(spells)) {
                return spells;
            }
            return [];
        }
    }
}
