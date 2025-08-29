// await FFT.Functions.updateSpells("e8IHzkyTqeZbu9x0", "Cleric", "full", "prepared");
async function updateSpells(classId: string, className: string, casterType: string, spellType: string): Promise<void> {
    try {
        // Get the class from compendium
        const classPack = game.packs.get("fftweaks.classes");
        const classDoc = await classPack?.getDocument(classId);

        if (!classDoc) {
            ui.notifications.error("Class not found in compendium");
            return;
        }

        // Get spell list journal
        const spellListJournal = await fromUuid("Compendium.fftweaks.journals.JournalEntry.ij43IJbeKdTP3rJd");
        if (!spellListJournal) {
            ui.notifications.error("Spell list journal not found");
            return;
        }

        // Find the spell list for the specified class
        const classSpellPage = (spellListJournal as any).pages.find(
            (page: any) => page.name.toLowerCase() === className.toLowerCase()
        );
        
        if (!classSpellPage) {
            ui.notifications.error(`Could not find spell list for class: ${className}`);
            return;
        }

        const allSpellUuids = classSpellPage.system.spells;

        // Organize spells by level (exclude cantrips - level 0)
        const spellsByLevel: Record<number, string[]> = {};
        
        for (const uuid of allSpellUuids) {
            try {
                const spell = await fromUuid(uuid) as any;
                if (spell && spell.system.level > 0) { // Exclude cantrips
                    const level = spell.system.level;
                    if (!spellsByLevel[level]) {
                        spellsByLevel[level] = [];
                    }
                    spellsByLevel[level].push(uuid);
                }
            } catch (error) {
                console.warn(`Could not load spell: ${uuid}`);
            }
        }

        // Get spell progression based on caster type
        const spellProgression = getSpellProgression(casterType);
        
        // Create advancements for each level
        const advancements: any[] = [];
        
        Object.entries(spellProgression).forEach(([levelStr, spellLevels]) => {
            const classLevel = parseInt(levelStr);
            
            spellLevels.forEach((hasSpells, spellLevel) => {
                if (hasSpells && spellLevel > 0 && spellsByLevel[spellLevel]) {
                    const advancement = spellType === "prepared" ? {
                        type: "ItemGrant",
                        configuration: {
                            items: spellsByLevel[spellLevel],
                            optional: false,
                            spell: null
                        },
                        value: {},
                        level: classLevel,
                        title: `${getOrdinal(spellLevel)} Level ${className} Spells`,
                        icon: "systems/dnd5e/icons/svg/items/spell.svg",
                        classRestriction: ""
                    } : {
                        type: "ItemChoice",
                        configuration: {
                            choices: {
                                "0": {
                                    count: getSpellsKnown(casterType, classLevel, spellLevel),
                                    replacement: false
                                }
                            },
                            allowDrops: true,
                            type: "spell",
                            pool: spellsByLevel[spellLevel].map((uuid: string) => ({ uuid })),
                            spell: null
                        },
                        value: {},
                        level: classLevel,
                        title: `Choose ${getOrdinal(spellLevel)} Level ${className} Spells`,
                        icon: "systems/dnd5e/icons/svg/items/spell.svg",
                        classRestriction: ""
                    };
                    
                    advancements.push(advancement);
                }
            });
        });

        // Get current advancement array
        const currentAdvancements = (classDoc as any).system.advancement || [];

        // Add the new advancements
        const updatedAdvancements = [...currentAdvancements, ...advancements];

        // Update the class document
        await (classDoc as any).update({
            system: {
                advancement: updatedAdvancements
            }
        });

        ui.notifications.info(`Successfully added ${advancements.length} spell advancements to ${className}!`);

    } catch (error) {
        console.error("Error updating spells:", error);
        ui.notifications.error("Failed to update spells - check console for details");
    }
}

function getSpellProgression(casterType: string): Record<number, boolean[]> {
    const progressions: Record<string, Record<number, boolean[]>> = {
        'full': {
            1: [false, true], // 1st level spells at level 1
            3: [false, false, true], // 2nd level spells at level 3
            5: [false, false, false, true], // 3rd level spells at level 5
            7: [false, false, false, false, true], // 4th level spells at level 7
            9: [false, false, false, false, false, true], // 5th level spells at level 9
            11: [false, false, false, false, false, false, true], // 6th level spells at level 11
            13: [false, false, false, false, false, false, false, true], // 7th level spells at level 13
            15: [false, false, false, false, false, false, false, false, true], // 8th level spells at level 15
            17: [false, false, false, false, false, false, false, false, false, true] // 9th level spells at level 17
        },
        'half': {
            2: [false, true], // 1st level spells at level 2
            5: [false, false, true], // 2nd level spells at level 5
            9: [false, false, false, true], // 3rd level spells at level 9
            13: [false, false, false, false, true], // 4th level spells at level 13
            17: [false, false, false, false, false, true] // 5th level spells at level 17
        },
        'third': {
            3: [false, true], // 1st level spells at level 3
            7: [false, false, true], // 2nd level spells at level 7
            13: [false, false, false, true], // 3rd level spells at level 13
            19: [false, false, false, false, true] // 4th level spells at level 19
        },
        'warlock': {
            1: [false, true], // 1st level spells at level 1
            3: [false, false, true], // 2nd level spells at level 3
            5: [false, false, false, true], // 3rd level spells at level 5
            7: [false, false, false, false, true], // 4th level spells at level 7
            9: [false, false, false, false, false, true] // 5th level spells at level 9
        }
    };
    
    return progressions[casterType] || {};
}

function getSpellsKnown(casterType: string, classLevel: number, spellLevel: number): number {
    // Basic spells known for choice-based casters
    if (casterType === 'full' && spellLevel === 1) return 2; // 2 first level spells
    if (casterType === 'half' && spellLevel === 1) return 2; // 2 first level spells
    return 1; // Default 1 spell for higher levels
}

function getOrdinal(num: number): string {
    const ordinals = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
    return ordinals[num] || `${num}th`;
}