namespace FFT {
    export class DNDCustomizerModule {
        static initialize(): void {
            Hooks.once("init", () => {
                (CONFIG as any).DND5E.SPELL_LISTS = [
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.GEc89WbpwBlsqP2z", // Artificer
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.fStduvMB22DYaXxY", // Wizard
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.vi259pfZpIXCmRFm", // Bard
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.15Mn1FInUBIKeu1o", // Druid
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.4n8XQA0Ta7ekghfk", // Warlock
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.jxTKgTNRnwWotwF9", // Cleric
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.a948mzXyJMCu9JGF", // Ranger
                    "Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd.JournalEntryPage.OqfVNJSlThWD7Z43"  // All
                ];
            });
        }
    }
}