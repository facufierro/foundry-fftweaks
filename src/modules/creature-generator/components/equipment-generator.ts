namespace FFT {
    export class EquipmentGenerator {
        private static readonly EQUIPMENT_COMPENDIUM_NAME = "fftweaks.items";

        static async applyEquipmentToActor(actor: Actor, template?: CreatureTemplate): Promise<boolean> {
            if (!actor) {
                console.warn("EquipmentGenerator: No actor provided");
                return false;
            }

            // If template is provided, use it directly, otherwise load from file
            let equipmentTemplate: EquipmentTemplate | null = null;
            if (template?.equipment) {
                equipmentTemplate = template.equipment;
            } else {
                // Legacy behavior - load from separate equipment file
                const actorName = actor.name ? (actor.name as string).toLowerCase().replace(/\s+/g, "-") : null;
                if (!actorName) {
                    console.warn("EquipmentGenerator: Actor has no name");
                    return false;
                }

                const legacyTemplate = await this.loadLegacyTemplate(actorName);
                if (!legacyTemplate) {
                    console.log(`EquipmentGenerator: No equipment template found for ${actorName}`);
                    return false;
                }
                equipmentTemplate = legacyTemplate;
            }

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
                console.error(`EquipmentGenerator: Error applying equipment to ${actor.name}:`, error);
                return false;
            }
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

            // Maybe pick a ranged set (70% chance)
            if (template.rangedSets && template.rangedSets.length > 0 && Math.random() * 100 <= 70) {
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

            // Roll for individual gear items
            if (template.gear && template.gear.length > 0) {
                const gearItems = this.rollForItems(template.gear);
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

            for (const lootItem of lootItems) {
                // Try to find the item in the compendium
                let itemData = await this.findItemInCompendium(lootItem.name);

                if (!itemData) {
                    // Create a placeholder item if not found in compendium
                    itemData = this.createPlaceholderItem(lootItem.name);
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
                await actor.createEmbeddedDocuments("Item", itemsToCreate);
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
                        value: `<p>Placeholder item: ${itemName}</p><p><em>This item was not found in the compendium and needs to be configured manually.</em></p>`
                    },
                    quantity: 1,
                    weight: 0,
                    price: {
                        value: 0,
                        denomination: "gp"
                    },
                    rarity: "common",
                    identified: true
                }
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

