namespace FFT {
    export class SpellSelector {
        static showDialog(character: Character) {
            new CustomDialog(
                `Spell Selector`,
                `<p>${character.class?.name || "Unknown"} Spell List.</p>`, // Safe access
                {
                    yes: {
                        label: "Add",
                        callback: () => {
                        }
                    },
                    no: {
                        label: "Cancel",
                        callback: () => {
                        }
                    }
                },
                "yes"
            ).render();
            SpellSelector.getSpellList(character);
        }
        static getSpellList(character: Character) {
            const journalID = "JournalEntry.fltmd5kijx3pTREA";
            const journal = game.journal.get(journalID);
            Debug.Log(journal);
            const spellList: String[] = [];

            // if the character.spells list has items in




            return spellList;
        }
        static checkKnownSpells(character: Character) {
            const knownSpellList: Item5e[] = [];

            return knownSpellList;
        }
    }
}

// static async getSpellData(spellListId: string): Promise<{ spells: Record<string, { id: string, level: number }> }> {
//     const [journalId, pageId] = spellListId.split(".");
//     const journal = game.journal.get(journalId);
//     const page = journal.pages.get(pageId);

//     const spellIds: string[] = page.system?.spells instanceof Set
//         ? Array.from(page.system.spells)
//         : Array.isArray(page.system?.spells)
//             ? page.system.spells
//             : [];
//     const spellList: Record<string, { id: string, level: number }> = Object.fromEntries(
//         await Promise.all(spellIds.map(async id => {
//             const spell = await fromUuid(id);
//             return spell instanceof Item ? [spell.name, { id: id, level: spell.system.level || 0 }] : null;
//         })).then(spells => spells.filter(Boolean))
//     );

//     console.log("Final Spell Dictionary:", spellList);
//     return {
//         spells: spellList,
//     };
// }

