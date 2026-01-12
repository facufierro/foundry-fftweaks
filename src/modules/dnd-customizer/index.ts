namespace FFT {
    export class DNDCustomizerModule {
        static pendingDefaults: string[] = [];
        static userListsRegistered = new Set<string>();
        static originalRegister: any;
        static dnd5eDefaults: Set<string>;

        static initialize(): void {
            Hooks.once("init", () => DNDCustomizerModule.patchSpellListRegistry());
            Hooks.once("ready", () => DNDCustomizerModule.registerCustomSpellLists());
        }

        static patchSpellListRegistry(): void {
            this.dnd5eDefaults = new Set((dnd5e as any).config.SPELL_LISTS);
            this.originalRegister = (dnd5e as any).registry.spellLists.register;
            (dnd5e as any).registry.spellLists.register = this.interceptRegister.bind(this);
        }

        static async interceptRegister(uuid: string) {
            if (this.dnd5eDefaults.has(uuid)) {
                console.log(`FFTweaks: Deferring registration of default list ${uuid}`);
                this.pendingDefaults.push(uuid);
                return; 
            }
            return this.originalRegister.call((dnd5e as any).registry.spellLists, uuid);
        }

        static async registerCustomSpellLists(): Promise<void> {
            console.log("FFTweaks: Searching for custom spell lists...");
            
            const journalEntry: any = await fromUuid("Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd");
            
            if (journalEntry) {
                const spellListPages = journalEntry.pages.filter((page: any) => page.type === "spells");
                console.log(`FFTweaks: Found ${spellListPages.length} user spell list pages`);

                for (const page of spellListPages) {
                    await this.registerSpellListPage(page);
                }
            } else {
                console.warn("FFTweaks: Could not find custom spell lists journal entry");
            }

            await this.processDeferredDefaults();
            
            console.log("FFTweaks: Spell list registration complete");
            console.log("FFTweaks: Final spell lists:", (dnd5e as any).registry.spellLists.options);
        }

        static async registerSpellListPage(page: any): Promise<void> {
            try {
                const type = page.system?.type;
                const identifier = page.system?.identifier;
                const key = `${type}:${identifier}`;
                
                this.userListsRegistered.add(key);
                
                console.log(`FFTweaks: Registering custom ${page.name} (${key})`);
                await (dnd5e as any).registry.spellLists.register(page.uuid);
            } catch (error) {
                console.error(`FFTweaks: Failed to register ${page.name}`, error);
            }
        }

        static async processDeferredDefaults(): Promise<void> {
            console.log(`FFTweaks: Processing ${this.pendingDefaults.length} deferred default lists...`);
            
            for (const uuid of this.pendingDefaults) {
                try {
                    const page: any = await fromUuid(uuid);
                    if (!page) continue;
                    
                    const type = page.system?.type;
                    const identifier = page.system?.identifier;
                    const key = `${type}:${identifier}`;

                    if (this.userListsRegistered.has(key)) {
                        console.log(`FFTweaks: Replacing default ${page.name} (${key}) with custom version`);
                    } else {
                        await this.originalRegister.call((dnd5e as any).registry.spellLists, uuid);
                    }
                } catch (error) {
                    console.error(`FFTweaks: Error processing default ${uuid}`, error);
                    await this.originalRegister.call((dnd5e as any).registry.spellLists, uuid);
                }
            }
        }
    }
}