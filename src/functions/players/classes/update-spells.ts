// Examples:
// await FFT.Functions.updateSpells("BB4w1RNuF0r4fQ68", "Bard", { level: 1, count: 4 });
// await FFT.Functions.updateSpells("e8IHzkyTqeZbu9x0", "Cleric", { level: 1, grant: 1 });
// await FFT.Functions.updateSpells("BB4w1RNuF0r4fQ68", "Bard", { level: "cantrip", count: 2 });
// await FFT.Functions.updateSpells("ymNXTrcVMRgQbqrq", "Wizard", { level: [1, 2], count: 1 });
// await FFT.Functions.updateSpells("BB4w1RNuF0r4fQ68", "Bard", { level: [], count: 1, replaceable: true });
// await FFT.Functions.updateSpells("BB4w1RNuF0r4fQ68", "Bard", { level: 1, choices: { 1: 2, 10: 1 } });
// await FFT.Functions.updateSpells("BB4w1RNuF0r4fQ68", "Bard", { level: 1, count: 2, prepared: 2, method: "spell" }); // Always prepared
// await FFT.Functions.updateSpells("e8IHzkyTqeZbu9x0", "Cleric", { level: 1, count: 2, ability: "wis" }); // Wisdom-based spells
// await FFT.Functions.updateSpells("ymNXTrcVMRgQbqrq", "Wizard", { level: 1, count: 1, ability: ["int", "wis"] }); // Multiple abilities
// await FFT.Functions.updateSpells("Uc4jj9CWXoJSZqTJ", "Wizard", { level: "cantrip", choices: { 1: 2 }, ability: ["int", "cha", "wis"] }); // Magic Initiate feat
// await FFT.Functions.updateSpells("Uc4jj9CWXoJSZqTJ", "Wizard", { level: 1, count: 1, uses: { max: 1, per: "lr" } }); // Once per long rest
// await FFT.Functions.updateSpells("featId", "Cleric", { level: 2, count: 1, uses: { max: "@prof", per: "lr", requireSlot: false } }); // Proficiency times per long rest, no slot needed

interface SpellOptions {
    level: number | string | number[];  // What spell levels to choose from
    count?: number;                     // How many spells (if simple)
    choices?: { [classLevel: number]: number }; // Complex level/count mapping
    grant?: number;                     // Grant all spells at this class level
    replaceable?: boolean;              // Can replace on level up
    prepared?: 0 | 1 | 2;               // Spell preparation: 0=unprepared, 1=prepared, 2=always prepared
    method?: string;                    // Spellcasting method: "spell", "pact", "innate", "atwill", etc.
    ability?: string | string[];        // Spellcasting ability: "int", "wis", "cha", etc. Can be multiple
    uses?: {                            // Spell uses configuration
        max: string | number;           // Maximum uses (can be formula like "@prof")
        per: string;                    // Recovery period: "sr", "lr", "day", etc.
        requireSlot?: boolean;          // Whether spell slot is still required
    };
}

async function updateSpells(itemId: string, spellListName: string, options: SpellOptions): Promise<void> {
    try {
        // Parse the much cleaner options
        const config = parseOptions(options);
        
        // Get item document and spell data
        const itemDoc = await getItemDocument(itemId);
        const spells = await getFilteredSpells(spellListName, config.spellLevels);
        
        // Create and add advancement
        const advancement = createAdvancement(config, spells);
        await addAdvancementToItem(itemDoc, advancement);
        
        // Success notification
        const levelText = getLevelText(options.level);
        const itemType = (itemDoc as any).type ? (itemDoc as any).type.charAt(0).toUpperCase() + (itemDoc as any).type.slice(1) : "Item";
        const itemName = (itemDoc as any).name || "Unknown";
        ui.notifications.info(`Added ${levelText} spell advancement to ${itemType}: ${itemName}`);
        
    } catch (error) {
        console.error("Error updating spells:", error);
        ui.notifications.error(`Failed: ${error.message}`);
    }
}

// Helper functions
function parseOptions(options: SpellOptions) {
    const { level, count = 1, choices, grant, replaceable = false, prepared, method, ability, uses } = options;
    
    // Parse spell levels
    let spellLevels: number[];
    if (Array.isArray(level)) {
        spellLevels = level.length === 0 ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : level;
    } else if (level === "cantrip") {
        spellLevels = [0];
    } else {
        spellLevels = [level as number];
    }
    
    // Parse level choices
    let levelChoices: { [level: number]: number };
    let primaryLevel: number;
    let isGrant: boolean;
    
    if (typeof grant === "number") {
        // Grant mode: use the grant value as the class level
        isGrant = true;
        primaryLevel = grant;
        levelChoices = { [grant]: 1 }; // The count doesn't matter for grants
    } else if (choices) {
        // Choice mode with complex level mapping
        isGrant = false;
        levelChoices = choices;
        primaryLevel = Math.min(...Object.keys(choices).map(Number));
    } else {
        // Simple choice mode
        isGrant = false;
        primaryLevel = 1;
        levelChoices = { 1: count };
    }
    
    return { 
        isGrant, 
        spellLevels, 
        levelChoices, 
        primaryLevel, 
        replaceable,
        prepared,
        method,
        ability,
        uses
    };
}

async function getItemDocument(itemId: string) {
    // Search all compendiums for any valid item type
    const packNames = [
        "fftweaks.classes",
        "fftweaks.backgrounds", 
        "fftweaks.feats",
        "fftweaks.species"
    ];
    
    const validItemTypes = ["background", "class", "feat", "species", "subclass"];
    
    for (const packName of packNames) {
        const pack = game.packs.get(packName);
        if (pack) {
            try {
                const doc = await pack.getDocument(itemId);
                if (doc && "type" in doc && doc.type && validItemTypes.includes(doc.type.toLowerCase())) {
                    return doc as any; // Cast to any to work with advancement system
                }
            } catch (error) {
                // Continue to next pack if not found
            }
        }
    }
    
    // If not found in packs, try world items
    const worldItem = game.items?.get(itemId);
    if (worldItem && validItemTypes.includes(worldItem.type.toLowerCase())) {
        return worldItem;
    }
    
    throw new Error("Item not found or is not a valid advancement-capable item type (Background, Class, Feat, Species, Subclass)");
}

async function getFilteredSpells(className: string, spellLevels: number[]) {
    const spellJournal = await fromUuid("Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd") as any;
    const spellPage = spellJournal.pages.find((p: any) => p.name.toLowerCase() === className.toLowerCase());
    if (!spellPage) throw new Error(`No spell list found for ${className}`);
    
    // Filter and sort spells
    const spellData: { uuid: string, level: number, name: string }[] = [];
    for (const uuid of spellPage.system.spells) {
        try {
            const spell = await fromUuid(uuid) as any;
            if (spell && spellLevels.includes(spell.system.level)) {
                spellData.push({ uuid, level: spell.system.level, name: spell.name });
            }
        } catch (e) {
            console.warn(`Failed to load spell: ${uuid}`);
        }
    }
    
    if (spellData.length === 0) throw new Error(`No spells found for specified level(s)`);
    
    // Sort by level, then alphabetically
    spellData.sort((a, b) => a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name));
    
    return spellData.map(spell => spell.uuid);
}

function createAdvancement(config: any, spells: string[]) {
    const { isGrant, levelChoices, primaryLevel, replaceable, spellLevels, prepared, method, ability, uses } = config;
    
    // Create spell configuration object using D&D 5e's SpellConfigurationData structure
    const spellConfig: any = {};
    
    // Set spellcasting ability (can be single ability or array of abilities)
    if (ability) {
        if (Array.isArray(ability)) {
            spellConfig.ability = ability;
        } else {
            spellConfig.ability = [ability]; // D&D 5e expects an array
        }
    }
    
    // Set preparation state (0=unprepared, 1=prepared, 2=always prepared)
    if (typeof prepared === "number") {
        spellConfig.prepared = prepared;
    }
    
    // Set spellcasting method
    if (method) {
        spellConfig.method = method;
    }
    
    // Set uses configuration
    if (uses) {
        spellConfig.uses = {
            max: uses.max,
            per: uses.per,
            requireSlot: uses.requireSlot || false
        };
    }
    
    if (isGrant) {
        return {
            type: "ItemGrant",
            configuration: { 
                items: spells, 
                optional: false, 
                spell: Object.keys(spellConfig).length > 0 ? spellConfig : null
            },
            value: {},
            level: primaryLevel,
            title: getGrantTitle(spellLevels),
            icon: "systems/dnd5e/icons/svg/items/spell.svg",
            classRestriction: ""
        };
    }
    
    return {
        type: "ItemChoice",
        configuration: {
            choices: createChoices(levelChoices, replaceable),
            allowDrops: false,  // Prevent duplicates by disabling manual drops
            type: "spell",
            pool: spells.map(uuid => ({ uuid })),
            restriction: { 
                type: "spell", 
                subtype: "", 
                level: spellLevels.length > 1 ? "available" : spellLevels[0].toString()
            },
            spell: Object.keys(spellConfig).length > 0 ? spellConfig : null
        },
        value: {},
        level: primaryLevel,
        title: getChoiceTitle(spellLevels),
        icon: "systems/dnd5e/icons/svg/items/spell.svg",
        classRestriction: ""
    };
}

function createChoices(levelChoices: { [level: number]: number }, replaceable: boolean) {
    const choices: any = {};
    
    // Add the specified level choices
    Object.entries(levelChoices).forEach(([level, count]) => {
        choices[parseInt(level)] = { count, replacement: replaceable };
    });
    
    // If replaceable is true, add replacement entries for ALL levels 1-20
    if (replaceable) {
        for (let level = 1; level <= 20; level++) {
            if (!choices[level]) {
                choices[level] = { count: 0, replacement: true };
            }
        }
    }
    
    return choices;
}

function getGrantTitle(spellLevels: number[]) {
    return spellLevels[0] === 0 ? "Cantrips" : `${getOrdinal(spellLevels[0])} Level Spells`;
}

function getChoiceTitle(spellLevels: number[]) {
    if (spellLevels.length > 1) return "Spells";
    return spellLevels[0] === 0 ? "Cantrips" : `${getOrdinal(spellLevels[0])} Level Spells`;
}

function getLevelText(level: any) {
    if (Array.isArray(level)) return level.length === 0 ? "All Level" : `Levels ${level.join("/")}`;
    return level === "cantrip" ? "Cantrip" : getOrdinal(level);
}

async function addAdvancementToItem(itemDoc: any, advancement: any) {
    const currentAdvancements = itemDoc.system.advancement || [];
    await itemDoc.update({ system: { advancement: [...currentAdvancements, advancement] } });
}

function getOrdinal(num: number): string {
    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    return ordinals[num] || `${num}th`;
}