namespace FFT {
    export interface WeaponItem {
        name: string;
        quantity: number;
        slot: "primary" | "secondary" | "none";
    }

    export interface WeaponSetOption {
        chance: number;
        items: WeaponItem[];
    }

    export interface EquipmentTemplate {
        weaponSets: WeaponSetOption[];
        altWeaponSets: WeaponSetOption[];
        thirdWeaponSets: WeaponSetOption[];
        armor: { name: string; chance: number }[];
        gear: { name: string; chance: number }[];
    }

    export interface EquipmentResult {
        weapons: {
            set1: { primary: string | null; secondary: string | null };
            set2: { primary: string | null; secondary: string | null };
            set3: { primary: string | null; secondary: string | null };
        };
        ammunition: { name: string; quantity: number }[];
        armor: string[];
        gear: string[];
    }

    export class EquipmentGenerator {
        /**
         * Randomly selects an item from a weighted list based on chance
         */
        private static selectByChance<T extends { chance: number }>(items: T[]): T | null {
            if (!items || items.length === 0) return null;

            const totalChance = items.reduce((sum, item) => sum + item.chance, 0);
            const roll = Math.random() * totalChance;
            
            let currentSum = 0;
            for (const item of items) {
                currentSum += item.chance;
                if (roll <= currentSum) {
                    return item;
                }
            }
            
            return items[items.length - 1]; // Fallback to last item
        }

        /**
         * Generates equipment for a creature based on explicit template structure
         * This replaces the old auto-classification system with explicit control
         */
        public static generateEquipment(template: EquipmentTemplate): EquipmentResult {
            console.log("🛡️ FFTweaks | Starting EXPLICIT equipment generation with chance-based option selection");
            
            const result: EquipmentResult = {
                weapons: {
                    set1: { primary: null, secondary: null },
                    set2: { primary: null, secondary: null },
                    set3: { primary: null, secondary: null }
                },
                ammunition: [],
                armor: [],
                gear: []
            };

            // Set 1: Primary weapon set from weaponSets
            if (template.weaponSets && template.weaponSets.length > 0) {
                const selectedOption1 = this.selectByChance(template.weaponSets);
                if (selectedOption1) {
                    console.log(`🗡️ FFTweaks | Selected weapon set 1 with ${selectedOption1.items.length} items`);
                    this.processWeaponSetItems(selectedOption1.items, result, 1);
                }
            }

            // Set 2: Alternative weapon set from altWeaponSets
            if (template.altWeaponSets && template.altWeaponSets.length > 0) {
                const selectedOption2 = this.selectByChance(template.altWeaponSets);
                if (selectedOption2) {
                    console.log(`🏹 FFTweaks | Selected weapon set 2 with ${selectedOption2.items.length} items`);
                    this.processWeaponSetItems(selectedOption2.items, result, 2);
                }
            }

            // Set 3: Third weapon set from thirdWeaponSets
            if (template.thirdWeaponSets && template.thirdWeaponSets.length > 0) {
                const selectedOption3 = this.selectByChance(template.thirdWeaponSets);
                if (selectedOption3) {
                    console.log(`⚔️ FFTweaks | Selected weapon set 3 with ${selectedOption3.items.length} items`);
                    this.processWeaponSetItems(selectedOption3.items, result, 3);
                }
            }

            // Generate armor
            if (template.armor && template.armor.length > 0) {
                const selectedArmor = this.selectByChance(template.armor);
                if (selectedArmor) {
                    result.armor.push(selectedArmor.name);
                    console.log(`🛡️ FFTweaks | Selected armor: ${selectedArmor.name}`);
                }
            }

            // Generate gear (multiple items possible)
            if (template.gear && template.gear.length > 0) {
                for (const gearItem of template.gear) {
                    if (Math.random() * 100 <= gearItem.chance) {
                        result.gear.push(gearItem.name);
                        console.log(`🎒 FFTweaks | Added gear: ${gearItem.name}`);
                    }
                }
            }

            console.log("✅ FFTweaks | EXPLICIT equipment generation complete:", result);
            return result;
        }

        /**
         * Process items from a weapon set and assign them to appropriate slots
         */
        private static processWeaponSetItems(items: WeaponItem[], result: EquipmentResult, setNumber: 1 | 2 | 3): void {
            const setKey = setNumber === 1 ? 'set1' : setNumber === 2 ? 'set2' : 'set3';
            
            for (const item of items) {
                switch (item.slot) {
                    case "primary":
                        result.weapons[setKey].primary = item.name;
                        console.log(`🗡️ FFTweaks | Set ${setNumber} primary: ${item.name} x${item.quantity}`);
                        break;
                    case "secondary":
                        result.weapons[setKey].secondary = item.name;
                        console.log(`🛡️ FFTweaks | Set ${setNumber} secondary: ${item.name} x${item.quantity}`);
                        break;
                    case "none":
                        // This is ammunition or extra items
                        result.ammunition.push({ name: item.name, quantity: item.quantity });
                        console.log(`🏹 FFTweaks | Added ammunition: ${item.name} x${item.quantity}`);
                        break;
                }
            }
        }

        /**
         * Applies equipment to a Foundry VTT actor using EXPLICIT set assignment
         * NO AUTO-CLASSIFICATION - uses template instructions exactly
         */
        public static async applyEquipmentToActor(actor: Actor, equipment: EquipmentResult): Promise<void> {
            console.log(`🎭 FFTweaks | Applying EXPLICIT equipment to actor: ${actor.name}`);
            
            const itemsToCreate: any[] = [];
            const setAssignments: { itemName: string; set: number; slot: 'primary' | 'secondary' }[] = [];
            
            // Process weapon sets and collect items to create
            const sets = [
                { set: equipment.weapons.set1, setNumber: 1 },
                { set: equipment.weapons.set2, setNumber: 2 },
                { set: equipment.weapons.set3, setNumber: 3 }
            ];

            for (const { set, setNumber } of sets) {
                // Primary weapon
                if (set.primary) {
                    const item = await this.findItemByName(set.primary);
                    if (item) {
                        const itemData = item.toObject() as any;
                        // Mark for explicit set assignment
                        itemData.flags = itemData.flags || {};
                        itemData.flags.fftweaks = { 
                            explicitSet: setNumber, 
                            explicitSlot: 'primary',
                            noAutoClassify: true 
                        };
                        itemData.system.equipped = true;
                        itemsToCreate.push(itemData);
                        setAssignments.push({ itemName: set.primary, set: setNumber, slot: 'primary' });
                        console.log(`🗡️ FFTweaks | Will equip ${set.primary} in set ${setNumber} primary`);
                    }
                }
                
                // Secondary weapon/shield
                if (set.secondary) {
                    const item = await this.findItemByName(set.secondary);
                    if (item) {
                        const itemData = item.toObject() as any;
                        // Mark for explicit set assignment
                        itemData.flags = itemData.flags || {};
                        itemData.flags.fftweaks = { 
                            explicitSet: setNumber, 
                            explicitSlot: 'secondary',
                            noAutoClassify: true 
                        };
                        itemData.system.equipped = true;
                        itemsToCreate.push(itemData);
                        setAssignments.push({ itemName: set.secondary, set: setNumber, slot: 'secondary' });
                        console.log(`🛡️ FFTweaks | Will equip ${set.secondary} in set ${setNumber} secondary`);
                    }
                }
            }

            // Add ammunition (not equipped in sets, just added to inventory)
            for (const ammoSpec of equipment.ammunition) {
                const item = await this.findItemByName(ammoSpec.name);
                if (item) {
                    const itemData = item.toObject() as any;
                    itemData.system.quantity = ammoSpec.quantity;
                    itemData.flags = itemData.flags || {};
                    itemData.flags.fftweaks = { 
                        isAmmunition: true,
                        noAutoClassify: true 
                    };
                    itemsToCreate.push(itemData);
                    console.log(`🏹 FFTweaks | Will add ${ammoSpec.name} x${ammoSpec.quantity} to inventory`);
                }
            }

            // Add armor
            for (const armorName of equipment.armor) {
                const item = await this.findItemByName(armorName);
                if (item) {
                    const itemData = item.toObject() as any;
                    itemData.system.equipped = true;
                    itemsToCreate.push(itemData);
                    console.log(`🛡️ FFTweaks | Will add ${armorName} to inventory`);
                }
            }

            // Add gear
            for (const gearName of equipment.gear) {
                const item = await this.findItemByName(gearName);
                if (item) {
                    const itemData = item.toObject() as any;
                    itemData.system.equipped = false;
                    itemsToCreate.push(itemData);
                    console.log(`🎒 FFTweaks | Will add ${gearName} to inventory`);
                }
            }

            // Create all items at once
            if (itemsToCreate.length > 0) {
                const createdItems = await actor.createEmbeddedDocuments("Item", itemsToCreate);
                console.log(`✅ FFTweaks | Created ${createdItems.length} items for ${actor.name}`);
                
                // Set flags to prevent auto-reorganization
                await this.markActorAsExplicit(actor, equipment, setAssignments);
            }
        }

        /**
         * Marks actor as using explicit weapon sets to prevent auto-classification
         */
        private static async markActorAsExplicit(
            actor: Actor, 
            equipment: EquipmentResult, 
            setAssignments: { itemName: string; set: number; slot: 'primary' | 'secondary' }[]
        ): Promise<void> {
            console.log("🔒 FFTweaks | Marking actor as using EXPLICIT weapon sets");
            
            // Mark this actor as having explicitly organized weapon sets
            await (actor as any).setFlag("fftweaks", "explicitWeaponSets", true);
            await (actor as any).setFlag("fftweaks", "weaponSetData", equipment);
            await (actor as any).setFlag("fftweaks", "setAssignments", setAssignments);
            
            // Store weapon set configuration to prevent auto-reorganization
            const setConfiguration = {
                set1: { 
                    primary: equipment.weapons.set1.primary, 
                    secondary: equipment.weapons.set1.secondary 
                },
                set2: { 
                    primary: equipment.weapons.set2.primary, 
                    secondary: equipment.weapons.set2.secondary 
                },
                set3: { 
                    primary: equipment.weapons.set3.primary, 
                    secondary: equipment.weapons.set3.secondary 
                }
            };
            
            await (actor as any).setFlag("fftweaks", "setConfiguration", setConfiguration);
            
            console.log("📍 FFTweaks | EXPLICIT weapon set configuration:", setConfiguration);
            console.log("📍 FFTweaks | Set assignments:", setAssignments);
            
            console.log("✅ FFTweaks | Actor marked as EXPLICIT - auto-classification DISABLED");
        }

        /**
         * Find item by name in compendiums
         */
        private static async findItemByName(itemName: string): Promise<Item | null> {
            try {
                // Search in fftweaks.items compendium first
                const fftweaksItemsPack = game.packs.get("fftweaks.items");
                if (fftweaksItemsPack) {
                    await fftweaksItemsPack.getIndex();
                    const entry = fftweaksItemsPack.index.find((i: any) => i.name?.toLowerCase() === itemName.toLowerCase());
                    if (entry) {
                        const document = await fftweaksItemsPack.getDocument(entry._id!);
                        if (document && (document as any).documentName === "Item") {
                            return document as Item;
                        }
                    }
                }
                
                // Search in world items
                let item = game.items?.find((i: any) => i.name?.toLowerCase() === itemName.toLowerCase());
                if (item) return item;
                
                // Search in other compendiums as fallback
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item" && pack.collection !== "fftweaks.items") {
                        await pack.getIndex();
                        const entry = pack.index.find((i: any) => i.name?.toLowerCase() === itemName.toLowerCase());
                        if (entry) {
                            const document = await pack.getDocument(entry._id!);
                            if (document && (document as any).documentName === "Item") {
                                return document as Item;
                            }
                        }
                    }
                }
                
                console.warn(`FFTweaks | Item not found: ${itemName}`);
                return null;
                
            } catch (error) {
                console.error(`FFTweaks | Error finding item ${itemName}:`, error);
                return null;
            }
        }

        /**
         * Debug function to validate weapon set structure
         */
        public static validateWeaponSets(template: EquipmentTemplate): boolean {
            console.log("🔍 FFTweaks | Validating EXPLICIT weapon set structure");
            
            const validateSet = (sets: WeaponSetOption[], setName: string): boolean => {
                if (!sets) return true; // Empty sets are valid
                
                for (let i = 0; i < sets.length; i++) {
                    const option = sets[i];
                    if (option.chance === undefined || option.chance < 0) {
                        console.error(`❌ FFTweaks | ${setName}[${i}] invalid chance: ${option.chance}`);
                        return false;
                    }
                    if (!option.items || !Array.isArray(option.items)) {
                        console.error(`❌ FFTweaks | ${setName}[${i}] missing or invalid items array`);
                        return false;
                    }
                    for (let j = 0; j < option.items.length; j++) {
                        const item = option.items[j];
                        if (!item.name) {
                            console.error(`❌ FFTweaks | ${setName}[${i}].items[${j}] missing name`);
                            return false;
                        }
                        if (item.quantity === undefined || item.quantity < 1) {
                            console.error(`❌ FFTweaks | ${setName}[${i}].items[${j}] invalid quantity: ${item.quantity}`);
                            return false;
                        }
                        if (!["primary", "secondary", "none"].includes(item.slot)) {
                            console.error(`❌ FFTweaks | ${setName}[${i}].items[${j}] invalid slot: ${item.slot}`);
                            return false;
                        }
                    }
                }
                return true;
            };

            const valid = validateSet(template.weaponSets, "weaponSets") &&
                         validateSet(template.altWeaponSets, "altWeaponSets") &&
                         validateSet(template.thirdWeaponSets, "thirdWeaponSets");

            if (valid) {
                console.log("✅ FFTweaks | EXPLICIT weapon set structure is valid");
            }
            
            return valid;
        }

        /**
         * Legacy function for backwards compatibility
         * @deprecated Use the new explicit generateEquipment instead
         */
        static async generateEquipmentLegacy(templateEquipment: any, actor: Actor): Promise<void> {
            console.warn("⚠️ FFTweaks | Using deprecated legacy equipment generation - update to EXPLICIT system");
        }
    }
}
