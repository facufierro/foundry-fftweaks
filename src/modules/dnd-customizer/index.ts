import { Debug } from "../../utils/debug";

export class DNDCustomizerModule {
    static pendingDefaults: string[] = [];
    static userListsRegistered = new Set<string>();
    static originalRegister: any;
    static dnd5eDefaults: Set<string>;

    static initialize(): void {
        DNDCustomizerModule.patchSpellListRegistry();
    }

    static patchSpellListRegistry(): void {
        this.dnd5eDefaults = new Set((dnd5e as any).config.SPELL_LISTS);
        this.originalRegister = (dnd5e as any).registry.spellLists.register;
        (dnd5e as any).registry.spellLists.register = this.interceptRegister.bind(this);
    }

    static async interceptRegister(uuid: string) {
        if (this.dnd5eDefaults.has(uuid)) {
            Debug.Log(`Deferring registration of default spell list`);
            this.pendingDefaults.push(uuid);
            return;
        }
        return this.originalRegister.call(dnd5e.registry.spellLists, uuid);
    }

    static async registerCustomSpellLists(): Promise<void> {
        Debug.Log("Searching for custom spell lists...");

        const journalEntry: any = await fromUuid("Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd" as any);

        if (journalEntry) {
            const spellListPages = journalEntry.pages.filter((page: any) => page.type === "spells");
            Debug.Log(`Found ${spellListPages.length} custom spell list pages`);

            for (const page of spellListPages) {
                await this.registerSpellListPage(page);
            }
        } else {
            Debug.Warn("Could not find custom spell lists journal entry");
        }

        await this.processDeferredDefaults();

        Debug.Success("Spell list registration complete");
    }

    static async registerSpellListPage(page: any): Promise<void> {
        try {
            const type = page.system?.type;
            const identifier = page.system?.identifier;
            const key = `${type}:${identifier}`;

            this.userListsRegistered.add(key);

            Debug.Log(`Registering custom spell list: ${page.name} (${key})`);
            await dnd5e.registry.spellLists.register(page.uuid);
        } catch (error) {
            Debug.Error(`Failed to register ${page.name}`, error);
        }
    }

    static async processDeferredDefaults(): Promise<void> {
        Debug.Log(`Processing ${this.pendingDefaults.length} deferred default spell lists...`);

        for (const uuid of this.pendingDefaults) {
            try {
                const page: any = await fromUuid(uuid as any);
                if (!page) continue;

                const type = page.system?.type;
                const identifier = page.system?.identifier;
                const key = `${type}:${identifier}`;

                if (this.userListsRegistered.has(key)) {
                    Debug.Success(`Replaced default ${page.name} (${key}) with custom version`);
                } else {
                    await this.originalRegister.call(dnd5e.registry.spellLists, uuid);
                }
            } catch (error) {
                Debug.Error(`Error processing default spell list ${uuid}`, error);
                await this.originalRegister.call(dnd5e.registry.spellLists, uuid);
            }
        }
    }
}