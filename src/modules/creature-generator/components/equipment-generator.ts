namespace FFT {
    export class EquipmentGenerator {
        private static readonly EQUIPMENT_COMPENDIUM_NAME = "fftweaks.items";
        private static equipmentList: any = null;

        static async applyEquipmentToActor(actor: Actor, template?: CreatureTemplate): Promise<boolean> {
            if (!actor) {
                console.warn("EquipmentGenerator: No actor provided");
                return false;
            }

            // Load equipment list if not already loaded
            if (!this.equipmentList) {
                await this.loadEquipmentList();
            }

            // If template is provided, use it directly for legacy support
            if (template?.equipment) {
                return this.applyTemplateEquipment(actor, template.equipment);
            }

            // Use new CR-based equipment generation
            return this.applyCRBasedEquipment(actor, template);
        }

        private static async loadEquipmentList(): Promise<void> {
            try {
                const response = await fetch(`modules/fftweaks/src/modules/creature-generator/data/equipment-list.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load equipment list: ${response.status}`);
                }
                this.equipmentList = await response.json();
                console.log("EquipmentGenerator: Equipment list loaded successfully");
            } catch (error) {
                console.error("EquipmentGenerator: Failed to load equipment list:", error);
                this.equipmentList = null;
            }
        }

        private static async applyCRBasedEquipment(actor: Actor, template?: CreatureTemplate): Promise<boolean> {
            if (!this.equipmentList) {
                console.warn("EquipmentGenerator: Equipment list not available");
                return false;
            }

            try {
                const targetCR = template ? CRCalculator.getTargetCR(template.type, template.baseCR) : CRCalculator.calculatePartyCR().calculatedCR;
                console.log(`EquipmentGenerator: Generating equipment for ${actor.name} at CR ${targetCR}`);

                const itemsToAdd: EquipmentItem[] = [];

                // Generate weapon (70% chance)
                if (Math.random() < 0.7) {
                    const weapon = this.selectWeaponByCR(targetCR);
                    if (weapon) {
                        itemsToAdd.push({ name: weapon.name, quantity: 1, equipped: true });
                    }
                }

                // Generate ranged weapon (40% chance)
                if (Math.random() < 0.4) {
                    const rangedWeapon = this.selectRangedWeaponByCR(targetCR);
                    if (rangedWeapon) {
                        itemsToAdd.push({ name: rangedWeapon.name, quantity: 1, equipped: true });
                        // Add ammunition
                        const ammo = this.selectAmmunitionForWeapon(rangedWeapon.name, targetCR);
                        if (ammo) {
                            itemsToAdd.push({ name: ammo.name, quantity: 20, equipped: false });
                        }
                    }
                }

                // Generate armor (80% chance)
                if (Math.random() < 0.8) {
                    const armor = this.selectArmorByCR(targetCR);
                    if (armor) {
                        itemsToAdd.push({ name: armor.name, quantity: 1, equipped: true });
                    }
                }

                // Generate shield (30% chance, only if no two-handed weapon)
                const hasTwoHandedWeapon = itemsToAdd.some(item => 
                    this.isTwoHandedWeapon(item.name)
                );
                if (!hasTwoHandedWeapon && Math.random() < 0.3) {
                    const shield = this.selectShieldByCR(targetCR);
                    if (shield) {
                        itemsToAdd.push({ name: shield.name, quantity: 1, equipped: true });
                    }
                }

                // Generate accessories (lower chance, higher CR)
                if (targetCR >= 3 && Math.random() < 0.2) {
                    const accessory = this.selectAccessoryByCR(targetCR);
                    if (accessory) {
                        itemsToAdd.push({ name: accessory.name, quantity: 1, equipped: true });
                    }
                }

                // Generate consumables (varying chances)
                const consumables = this.selectConsumablesByCR(targetCR);
                itemsToAdd.push(...consumables);

                // Generate basic gear
                const basicGear = this.selectBasicGearByCR(targetCR);
                itemsToAdd.push(...basicGear);

                if (itemsToAdd.length > 0) {
                    await this.addItemsToActor(actor, itemsToAdd);
                    console.log(`EquipmentGenerator: Successfully equipped ${actor.name} with ${itemsToAdd.length} items`);
                }

                return true;

            } catch (error) {
                console.error(`EquipmentGenerator: Error applying CR-based equipment to ${actor.name}:`, error);
                return false;
            }
        }

        private static async applyTemplateEquipment(actor: Actor, equipmentTemplate: EquipmentTemplate): Promise<boolean> {
            try {
                const itemsToAdd = this.rollForStructuredItems(equipmentTemplate);

                if (itemsToAdd.length === 0) {
                    console.log(`EquipmentGenerator: No items rolled for ${actor.name}`);
                    return true;
                }

                await this.addItemsToActor(actor, itemsToAdd);
                console.log(`EquipmentGenerator: Successfully equipped ${actor.name} with ${itemsToAdd.length} items`);
                return true;

            } catch (error) {
                console.error(`EquipmentGenerator: Error applying template equipment to ${actor.name}:`, error);
                return false;
            }
        }

        private static selectWeaponByCR(targetCR: number): any {
            const allWeapons = [
                ...this.equipmentList.weapons.simple.melee,
                ...this.equipmentList.weapons.martial.melee,
                ...this.equipmentList.weapons.magical.weapons
            ];
            
            const suitableWeapons = allWeapons.filter(weapon => 
                targetCR >= weapon.crRange[0] && targetCR <= weapon.crRange[1]
            );

            if (suitableWeapons.length === 0) {
                // Fallback to simple weapons for very low CR
                return this.equipmentList.weapons.simple.melee[0];
            }

            return suitableWeapons[Math.floor(Math.random() * suitableWeapons.length)];
        }

        private static selectRangedWeaponByCR(targetCR: number): any {
            const allRangedWeapons = [
                ...this.equipmentList.weapons.simple.ranged,
                ...this.equipmentList.weapons.martial.ranged
            ];
            
            const suitableWeapons = allRangedWeapons.filter(weapon => 
                targetCR >= weapon.crRange[0] && targetCR <= weapon.crRange[1]
            );

            if (suitableWeapons.length === 0) {
                return this.equipmentList.weapons.simple.ranged[0];
            }

            return suitableWeapons[Math.floor(Math.random() * suitableWeapons.length)];
        }

        private static selectArmorByCR(targetCR: number): any {
            const allArmor = [
                ...this.equipmentList.armor.light,
                ...this.equipmentList.armor.medium,
                ...this.equipmentList.armor.heavy,
                ...this.equipmentList.armor.magical
            ];
            
            const suitableArmor = allArmor.filter(armor => 
                targetCR >= armor.crRange[0] && targetCR <= armor.crRange[1]
            );

            if (suitableArmor.length === 0) {
                return this.equipmentList.armor.light[0];
            }

            return suitableArmor[Math.floor(Math.random() * suitableArmor.length)];
        }

        private static selectShieldByCR(targetCR: number): any {
            const allShields = [
                ...this.equipmentList.armor.shields,
                ...this.equipmentList.armor.magical.filter((item: any) => item.name.includes("Shield"))
            ];
            
            const suitableShields = allShields.filter(shield => 
                targetCR >= shield.crRange[0] && targetCR <= shield.crRange[1]
            );

            if (suitableShields.length === 0) {
                return this.equipmentList.armor.shields[0];
            }

            return suitableShields[Math.floor(Math.random() * suitableShields.length)];
        }

        private static selectAccessoryByCR(targetCR: number): any {
            const allAccessories = [
                ...this.equipmentList.accessories.rings,
                ...this.equipmentList.accessories.cloaks,
                ...this.equipmentList.accessories.amulets,
                ...this.equipmentList.accessories.boots,
                ...this.equipmentList.accessories.gloves
            ];
            
            const suitableAccessories = allAccessories.filter(accessory => 
                targetCR >= accessory.crRange[0] && targetCR <= accessory.crRange[1]
            );

            if (suitableAccessories.length === 0) {
                return null;
            }

            return suitableAccessories[Math.floor(Math.random() * suitableAccessories.length)];
        }

        private static selectConsumablesByCR(targetCR: number): EquipmentItem[] {
            const consumables: EquipmentItem[] = [];
            
            // Healing potions (common)
            if (Math.random() < 0.6) {
                const healingPotions = this.equipmentList.consumables.potions.filter((potion: any) => 
                    potion.name.includes("Healing") && targetCR >= potion.crRange[0] && targetCR <= potion.crRange[1]
                );
                if (healingPotions.length > 0) {
                    const potion = healingPotions[Math.floor(Math.random() * healingPotions.length)];
                    consumables.push({ name: potion.name, quantity: 1, equipped: false });
                }
            }

            // Other potions (rare)
            if (targetCR >= 4 && Math.random() < 0.2) {
                const otherPotions = this.equipmentList.consumables.potions.filter((potion: any) => 
                    !potion.name.includes("Healing") && targetCR >= potion.crRange[0] && targetCR <= potion.crRange[1]
                );
                if (otherPotions.length > 0) {
                    const potion = otherPotions[Math.floor(Math.random() * otherPotions.length)];
                    consumables.push({ name: potion.name, quantity: 1, equipped: false });
                }
            }

            // Scrolls (rare, higher CR)
            if (targetCR >= 3 && Math.random() < 0.15) {
                const scrolls = this.equipmentList.consumables.scrolls.filter((scroll: any) => 
                    targetCR >= scroll.crRange[0] && targetCR <= scroll.crRange[1]
                );
                if (scrolls.length > 0) {
                    const scroll = scrolls[Math.floor(Math.random() * scrolls.length)];
                    consumables.push({ name: scroll.name, quantity: 1, equipped: false });
                }
            }

            return consumables;
        }

        private static selectBasicGearByCR(targetCR: number): EquipmentItem[] {
            const gear: EquipmentItem[] = [];
            const basicItems = [
                { name: "Rations (1 day)", chance: 0.7, quantity: 2 },
                { name: "Torch", chance: 0.8, quantity: 3 },
                { name: "Rope, Hempen (50 feet)", chance: 0.3, quantity: 1 },
                { name: "Signal Whistle", chance: 0.3, quantity: 1 },
                { name: "Manacles", chance: 0.2, quantity: 1 }
            ];

            for (const item of basicItems) {
                if (Math.random() < item.chance) {
                    gear.push({ name: item.name, quantity: item.quantity, equipped: false });
                }
            }

            return gear;
        }

        private static selectAmmunitionForWeapon(weaponName: string, targetCR: number): any {
            const weaponToAmmo: Record<string, string> = {
                "Shortbow": "Arrows",
                "Longbow": "Arrows",
                "Light Crossbow": "Crossbow Bolts",
                "Hand Crossbow": "Crossbow Bolts",
                "Heavy Crossbow": "Crossbow Bolts",
                "Blowgun": "Blowgun Needles",
                "Sling": "Sling Bullets"
            };

            const ammoType = weaponToAmmo[weaponName];
            if (!ammoType) return null;

            const ammunition = this.equipmentList.gear.ammunition.filter((ammo: any) => 
                ammo.name.includes(ammoType) && targetCR >= ammo.crRange[0] && targetCR <= ammo.crRange[1]
            );

            if (ammunition.length === 0) {
                // Fallback to basic ammunition
                const basicAmmo = this.equipmentList.gear.ammunition.find((ammo: any) => 
                    ammo.name === ammoType
                );
                return basicAmmo || null;
            }

            return ammunition[Math.floor(Math.random() * ammunition.length)];
        }

        private static isTwoHandedWeapon(weaponName: string): boolean {
            const twoHandedWeapons = [
                "Greataxe", "Greatsword", "Maul", "Pike", "Glaive", "Halberd",
                "Lance", "Heavy Crossbow", "Longbow"
            ];
            return twoHandedWeapons.some(weapon => weaponName.includes(weapon));
        }

        private static async loadLegacyTemplate(templateName: string): Promise<EquipmentTemplate | null> {
            try {
                const response = await fetch(`modules/fftweaks/src/modules/creature-generator/data/${templateName}.json`);
                if (!response.ok) {
                    return null;
                }
                const template: any = await response.json();
                
                // Convert legacy format to new format
                if (template.weaponSets || template.rangedSets || template.armor || template.gear) {
                    return {
                        weaponSets: template.weaponSets,
                        rangedSets: template.rangedSets,
                        armor: template.armor,
                        gear: template.gear
                    };
                } else if (template.items) {
                    // Legacy format - convert to gear
                    return {
                        gear: template.items
                    };
                }
                
                return null;
            } catch (error) {
                console.warn(`EquipmentGenerator: Could not load template ${templateName}:`, error);
                return null;
            }
        }

        private static rollForStructuredItems(template: EquipmentTemplate): EquipmentItem[] {
            const itemsToAdd: EquipmentItem[] = [];

            // Always pick one weapon set if available
            if (template.weaponSets && template.weaponSets.length > 0) {
                const weaponSet = this.rollForWeaponSet(template.weaponSets);
                if (weaponSet && weaponSet.items) {
                    itemsToAdd.push(...weaponSet.items);
                }
            }

            // Maybe pick a ranged set (50-80% chance, randomized)
            const rangedChance = 50 + Math.random() * 30; // 50% to 80%
            if (template.rangedSets && template.rangedSets.length > 0 && Math.random() * 100 <= rangedChance) {
                const rangedSet = this.rollForWeaponSet(template.rangedSets);
                if (rangedSet && rangedSet.items) {
                    itemsToAdd.push(...rangedSet.items);
                }
            }

            // Always pick one armor if available
            if (template.armor && template.armor.length > 0) {
                const armor = this.rollForArmor(template.armor);
                if (armor) {
                    itemsToAdd.push({
                        name: armor.name,
                        quantity: 1,
                        equipped: armor.equipped ?? true
                    });
                }
            }

            // Roll for individual gear items with slightly randomized chances
            if (template.gear && template.gear.length > 0) {
                const modifiedGear = template.gear.map(item => ({
                    ...item,
                    // Add ±10% randomization to gear chances
                    chance: Math.max(5, Math.min(95, (item.chance || 100) + (Math.random() * 20 - 10)))
                }));
                const gearItems = this.rollForItems(modifiedGear);
                itemsToAdd.push(...gearItems);
            }

            return itemsToAdd;
        }

        private static rollForWeaponSet(weaponSets: EquipmentItem[]): EquipmentItem | null {
            const roll = Math.random() * 100;
            let cumulative = 0;

            for (const weaponSet of weaponSets) {
                cumulative += weaponSet.chance || 0;
                if (roll <= cumulative) {
                    return weaponSet;
                }
            }

            // If no set was selected, return the first one as fallback
            return weaponSets[0] || null;
        }

        private static rollForArmor(armorOptions: EquipmentItem[]): EquipmentItem | null {
            const roll = Math.random() * 100;
            let cumulative = 0;

            for (const armor of armorOptions) {
                cumulative += armor.chance || 0;
                if (roll <= cumulative) {
                    return armor;
                }
            }

            // If no armor was selected, return the first one as fallback
            return armorOptions[0] || null;
        }

        private static rollForItems(items: EquipmentItem[]): EquipmentItem[] {
            const successfulItems: EquipmentItem[] = [];

            for (const item of items) {
                const chance = item.chance || 100; // Default to 100% if no chance specified
                const roll = Math.random() * 100;
                if (roll <= chance) {
                    successfulItems.push(item);
                }
            }

            return successfulItems;
        }

        private static async addItemsToActor(actor: Actor, lootItems: EquipmentItem[]): Promise<void> {
            const itemsToCreate: any[] = [];

            console.log(`EquipmentGenerator: Processing ${lootItems.length} items for ${actor.name}`);

            for (const lootItem of lootItems) {
                console.log(`EquipmentGenerator: Looking for item "${lootItem.name}"`);
                
                // Try to find the item in the compendium
                let itemData = await this.findItemInCompendium(lootItem.name);

                if (!itemData) {
                    console.log(`EquipmentGenerator: Item "${lootItem.name}" not found in compendium, creating placeholder`);
                    // Create a placeholder item if not found in compendium
                    itemData = this.createPlaceholderItem(lootItem.name);
                } else {
                    console.log(`EquipmentGenerator: Item "${lootItem.name}" found in compendium`);
                }

                // Set quantity and equipped state
                const itemToAdd = foundry.utils.duplicate(itemData);
                if (itemToAdd.system?.quantity !== undefined) {
                    itemToAdd.system.quantity = lootItem.quantity || 1;
                }
                if (itemToAdd.system?.equipped !== undefined) {
                    itemToAdd.system.equipped = lootItem.equipped ?? false;
                }

                itemsToCreate.push(itemToAdd);
            }

            if (itemsToCreate.length > 0) {
                console.log(`EquipmentGenerator: Adding ${itemsToCreate.length} items to ${actor.name}`);
                await actor.createEmbeddedDocuments("Item", itemsToCreate);
            } else {
                console.log(`EquipmentGenerator: No items to add to ${actor.name}`);
            }
        }

        private static async findItemInCompendium(itemName: string): Promise<any | null> {
            try {
                const compendium = game.packs.get(this.EQUIPMENT_COMPENDIUM_NAME);
                if (!compendium) {
                    console.warn(`EquipmentGenerator: Compendium ${this.EQUIPMENT_COMPENDIUM_NAME} not found`);
                    return null;
                }

                // Search for item by name (case insensitive)
                const index = await compendium.getIndex();
                const itemEntry = index.find((entry: any) =>
                    entry.name.toLowerCase() === itemName.toLowerCase()
                );

                if (!itemEntry) {
                    return null;
                }

                const itemDocument = await compendium.getDocument(itemEntry._id);
                return itemDocument?.toObject();

            } catch (error) {
                console.warn(`EquipmentGenerator: Error searching compendium for ${itemName}:`, error);
                return null;
            }
        }

        private static createPlaceholderItem(itemName: string): any {
            return {
                name: itemName,
                type: "loot",
                img: "icons/svg/item-bag.svg",
                system: {
                    description: {
                        value: `<p><strong>${itemName}</strong></p><p><em>This item was not found in the compendium and needs to be configured manually.</em></p>`,
                        chat: ""
                    },
                    source: {
                        custom: "",
                        rules: "2024",
                        revision: 1
                    },
                    quantity: 1,
                    weight: {
                        value: 0,
                        units: "lb"
                    },
                    price: {
                        value: 0,
                        denomination: "gp"
                    },
                    rarity: "common",
                    identified: true,
                    unidentified: {
                        description: ""
                    },
                    container: null,
                    properties: [],
                    type: {
                        value: "",
                        subtype: ""
                    }
                },
                effects: [],
                ownership: {
                    default: 0
                },
                flags: {}
            };
        }

        static async generateEquipment(actorName?: string): Promise<void> {
            let actor: Actor | null = null;

            if (actorName) {
                actor = game.actors?.find(a => a.name && (a.name as string).toLowerCase() === actorName.toLowerCase()) || null;
            } else {
                const selectedTokens = canvas.tokens?.controlled || [];
                if (selectedTokens.length === 1) {
                    actor = selectedTokens[0].actor;
                }
            }

            if (!actor) {
                ui.notifications?.warn("No valid actor found. Please select a token or provide an actor name.");
                return;
            }

            const success = await this.applyEquipmentToActor(actor);
            if (success) {
                ui.notifications?.info(`Equipment applied to ${actor.name}`);
            } else {
                ui.notifications?.warn(`Failed to apply equipment to ${actor.name}`);
            }
        }
    }
}

