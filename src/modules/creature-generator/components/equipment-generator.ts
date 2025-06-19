namespace FFT {
    export interface InventoryItem {
        name: string;
        quantity: number;
    }

    export interface SetAssignment {
        item: string;
        slot: "primary" | "secondary" | "none";
    }

    export interface Loadout {
        chance: number;
        inventory: InventoryItem[];
        sets: {
            set1: SetAssignment[];
            set2: SetAssignment[];
            set3: SetAssignment[];
        };
    }

    export interface EquipmentTemplate {
        loadouts: Loadout[];
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
         * Generates equipment for a creature based on loadout system
         * Each loadout defines complete inventory and set assignments
         */
        public static generateEquipment(template: EquipmentTemplate): { equipment: EquipmentResult, selectedLoadout: Loadout | null } {
            console.log("🛡️ FFTweaks | Starting LOADOUT-based equipment generation");

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

            let selectedLoadout: Loadout | null = null;

            // Select a loadout
            if (template.loadouts && template.loadouts.length > 0) {
                selectedLoadout = this.selectByChance(template.loadouts);
                if (selectedLoadout) {
                    console.log(`🎒 FFTweaks | Selected loadout with ${selectedLoadout.inventory.length} inventory items`);

                    // Process inventory to find ammunition
                    for (const invItem of selectedLoadout.inventory) {
                        if (this.isAmmunition(invItem.name)) {
                            result.ammunition.push({ name: invItem.name, quantity: invItem.quantity });
                            console.log(`🏹 FFTweaks | Added ammunition: ${invItem.name} x${invItem.quantity}`);
                        }
                    }

                    // Process set assignments
                    this.processSetAssignments(selectedLoadout.sets.set1, result, 1);
                    this.processSetAssignments(selectedLoadout.sets.set2, result, 2);
                    this.processSetAssignments(selectedLoadout.sets.set3, result, 3);
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

            console.log("✅ FFTweaks | LOADOUT equipment generation complete:", result);
            return { equipment: result, selectedLoadout };
        }

        /**
         * Process set assignments for a specific set
         */
        private static processSetAssignments(assignments: SetAssignment[], result: EquipmentResult, setNumber: 1 | 2 | 3): void {
            const setKey = setNumber === 1 ? 'set1' : setNumber === 2 ? 'set2' : 'set3';

            for (const assignment of assignments) {
                switch (assignment.slot) {
                    case "primary":
                        result.weapons[setKey].primary = assignment.item;
                        console.log(`🗡️ FFTweaks | Set ${setNumber} primary: ${assignment.item}`);
                        break;
                    case "secondary":
                        result.weapons[setKey].secondary = assignment.item;
                        console.log(`🛡️ FFTweaks | Set ${setNumber} secondary: ${assignment.item}`);
                        break;
                    case "none":
                        // This shouldn't happen in set assignments, but handle it gracefully
                        console.log(`⚠️ FFTweaks | Set ${setNumber} item with no slot: ${assignment.item}`);
                        break;
                }
            }
        }

        /**
         * Check if an item is ammunition
         */
        private static isAmmunition(itemName: string): boolean {
            const ammunitionTypes = ['bolts', 'arrows', 'sling bullets', 'bullets', 'darts'];
            return ammunitionTypes.some(ammo => itemName.toLowerCase().includes(ammo));
        }
        /**
         * Applies equipment to a Foundry VTT actor using LOADOUT system
         * Creates inventory items and assigns them to weapon sets
         */
        public static async applyEquipmentToActor(actor: Actor, equipment: EquipmentResult, selectedLoadout: Loadout): Promise<void> {
            console.log(`🎭 FFTweaks | Applying LOADOUT equipment to actor: ${actor.name}`);

            const itemsToCreate: any[] = [];
            const setAssignments: { itemName: string; set: number; slot: 'primary' | 'secondary' }[] = [];

            // Create all inventory items from the loadout
            for (const invItem of selectedLoadout.inventory) {
                const item = await this.findItemByName(invItem.name);
                if (item) {
                    const itemData = item.toObject() as any;
                    itemData.system.quantity = invItem.quantity;
                    itemData.flags = itemData.flags || {};
                    itemData.flags.fftweaks = {
                        fromLoadout: true,
                        noAutoClassify: true
                    };

                    // Only equip items that are assigned to set 1 (default active set)
                    const isInSet1 = selectedLoadout.sets.set1.some(assignment =>
                        assignment.item === invItem.name && assignment.slot !== 'none'
                    );
                    itemData.system.equipped = isInSet1;

                    itemsToCreate.push(itemData);
                    console.log(`📦 FFTweaks | Will add ${invItem.name} x${invItem.quantity} (equipped: ${isInSet1})`);
                    console.log(`🔍 FFTweaks | Set1 assignments:`, selectedLoadout.sets.set1);
                    console.log(`🔍 FFTweaks | Checking item ${invItem.name} against set1:`, selectedLoadout.sets.set1.map(a => `${a.item}:${a.slot}`));
                }
            }

            // Track set assignments for HUD integration
            this.collectSetAssignments(selectedLoadout.sets, setAssignments);

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
            }            // Create all items at once
            if (itemsToCreate.length > 0) {
                const createdItems = await actor.createEmbeddedDocuments("Item", itemsToCreate);
                console.log(`✅ FFTweaks | Created ${createdItems.length} items for ${actor.name}`);
                
                // Set flags to prevent auto-reorganization
                await this.markActorAsLoadoutBased(actor, equipment, selectedLoadout, setAssignments);
                
                // Apply loadout-based weapon set assignments to Argon HUD
                setTimeout(() => {
                    this.applyLoadoutToArgonHUD(actor, selectedLoadout);
                }, 500);
            }
        }

        /**
         * Apply loadout-based weapon set assignments directly to Argon HUD
         */
        private static async applyLoadoutToArgonHUD(actor: Actor, selectedLoadout: Loadout): Promise<void> {
            console.log(`🎯 FFTweaks | Applying loadout to Argon HUD for ${actor.name}`);
            
            const hudRoot = document.querySelector(".extended-combat-hud");
            if (!hudRoot) {
                console.log("🎯 FFTweaks | No Argon HUD found");
                return;
            }
            
            const weaponSets = hudRoot.querySelectorAll(".weapon-set");
            if (weaponSets.length === 0) {
                console.log("🎯 FFTweaks | No weapon sets found in HUD");
                return;
            }
            
            // Apply assignments for each set
            const sets = [selectedLoadout.sets.set1, selectedLoadout.sets.set2, selectedLoadout.sets.set3];
            for (let i = 0; i < Math.min(sets.length, weaponSets.length); i++) {
                const setElement = weaponSets[i] as HTMLElement;
                const setAssignments = sets[i];
                const setNumber = i + 1;
                
                // Clear the set first
                const primarySlot = setElement.querySelector(".set-primary") as HTMLElement;
                const secondarySlot = setElement.querySelector(".set-secondary") as HTMLElement;
                if (primarySlot) primarySlot.style.backgroundImage = "";
                if (secondarySlot) secondarySlot.style.backgroundImage = "";
                
                // Apply each assignment
                for (const assignment of setAssignments) {
                    if (assignment.slot === "none") continue;
                    
                    const item = actor.items.find((i: any) => i.name === assignment.item);
                    if (!item || !item.img) continue;
                    
                    const slot = assignment.slot === "primary" ? primarySlot : secondarySlot;
                    if (slot) {
                        slot.style.backgroundImage = `url("${item.img}")`;
                        console.log(`🎯 FFTweaks | Set ${setNumber} ${assignment.slot}: ${assignment.item} (${item.img})`);
                    }
                }
            }
            
            console.log(`✅ FFTweaks | Applied loadout to Argon HUD weapon sets`);
        }

        /**
         * Collect set assignments for tracking
         */
        private static collectSetAssignments(sets: { set1: SetAssignment[], set2: SetAssignment[], set3: SetAssignment[] }, setAssignments: { itemName: string; set: number; slot: 'primary' | 'secondary' }[]): void {
            [sets.set1, sets.set2, sets.set3].forEach((setItems, index) => {
                const setNumber = index + 1;
                setItems.forEach(assignment => {
                    if (assignment.slot === 'primary' || assignment.slot === 'secondary') {
                        setAssignments.push({
                            itemName: assignment.item,
                            set: setNumber,
                            slot: assignment.slot
                        });
                    }
                });
            });
        }

        /**
         * Marks actor as using loadout-based weapon sets
         */
        private static async markActorAsLoadoutBased(
            actor: Actor,
            equipment: EquipmentResult,
            selectedLoadout: Loadout,
            setAssignments: { itemName: string; set: number; slot: 'primary' | 'secondary' }[]
        ): Promise<void> {
            console.log("🔒 FFTweaks | Marking actor as using LOADOUT-based weapon sets");

            // Mark this actor as having loadout-based organization
            await (actor as any).setFlag("fftweaks", "useLoadoutSystem", true);
            await (actor as any).setFlag("fftweaks", "weaponSetData", equipment);
            await (actor as any).setFlag("fftweaks", "selectedLoadout", selectedLoadout);
            await (actor as any).setFlag("fftweaks", "setAssignments", setAssignments);

            console.log("✅ FFTweaks | Actor marked as LOADOUT-based - auto-classification DISABLED");
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
         * Debug function to validate loadout structure
         */
        public static validateWeaponSets(template: EquipmentTemplate): boolean {
            console.log("🔍 FFTweaks | Validating LOADOUT structure");

            if (!template.loadouts || !Array.isArray(template.loadouts)) {
                console.error("❌ FFTweaks | Missing or invalid loadouts array");
                return false;
            }

            for (let i = 0; i < template.loadouts.length; i++) {
                const loadout = template.loadouts[i];
                if (loadout.chance === undefined || loadout.chance < 0) {
                    console.error(`❌ FFTweaks | loadouts[${i}] invalid chance: ${loadout.chance}`);
                    return false;
                }
                if (!loadout.inventory || !Array.isArray(loadout.inventory)) {
                    console.error(`❌ FFTweaks | loadouts[${i}] missing or invalid inventory`);
                    return false;
                }
                if (!loadout.sets || !loadout.sets.set1 || !loadout.sets.set2 || !loadout.sets.set3) {
                    console.error(`❌ FFTweaks | loadouts[${i}] missing or invalid sets`);
                    return false;
                }

                // Validate inventory items
                for (let j = 0; j < loadout.inventory.length; j++) {
                    const item = loadout.inventory[j];
                    if (!item.name || item.quantity === undefined || item.quantity < 1) {
                        console.error(`❌ FFTweaks | loadouts[${i}].inventory[${j}] invalid item`);
                        return false;
                    }
                }

                // Validate set assignments
                const sets = [loadout.sets.set1, loadout.sets.set2, loadout.sets.set3];
                for (let setIndex = 0; setIndex < sets.length; setIndex++) {
                    const setAssignments = sets[setIndex];
                    for (let k = 0; k < setAssignments.length; k++) {
                        const assignment = setAssignments[k];
                        if (!assignment.item || !["primary", "secondary", "none"].includes(assignment.slot)) {
                            console.error(`❌ FFTweaks | loadouts[${i}].sets.set${setIndex + 1}[${k}] invalid assignment`);
                            return false;
                        }
                    }
                }
            }

            console.log("✅ FFTweaks | LOADOUT structure is valid");
            return true;
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
