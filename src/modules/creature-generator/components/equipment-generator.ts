namespace FFT {
    export class EquipmentGenerator {
        static async generateEquipment(templateEquipment: Equipment, actor: Actor): Promise<void> {
            try {
                const selectedEquipment: any[] = [];
                
                // Generate weapon sets - ensure proper weapon set assignment
                const weaponSet = EquipmentGenerator.selectRandomItem(templateEquipment.weaponSets);
                if (weaponSet) {
                    let weaponCount = 0;
                    let shieldCount = 0;
                    
                    for (const itemName of weaponSet.items) {
                        const item = await EquipmentGenerator.findItemByName(itemName);
                        if (item) {
                            let itemData = item.toObject();
                            const system = itemData.system as any;
                            const itemType = system?.type?.value;
                            const baseType = system?.type?.baseItem; // Also check baseItem for D&D 5e
                            // D&D 5e weapon types: simpleM, simpleR, martialM, martialR, etc.
                            const isWeapon = itemType === "weapon" || 
                                           itemType?.includes("M") || // Melee weapons (simpleM, martialM)
                                           itemType?.includes("R") || // Ranged weapons (simpleR, martialR)
                                           system?.actionType || 
                                           system?.damage?.parts?.length > 0;
                            
                            console.log(`FFTweaks | Processing item: ${itemName}`);
                            console.log(`FFTweaks | - type.value: ${itemType}`);
                            console.log(`FFTweaks | - type.baseItem: ${baseType}`);
                            console.log(`FFTweaks | - actionType: ${system?.actionType}`);
                            console.log(`FFTweaks | - has damage: ${!!system?.damage?.parts?.length}`);
                            console.log(`FFTweaks | - isWeapon: ${isWeapon}`);
                            
                            // Configure weapon set and slot assignment
                            if (isWeapon) {
                                weaponCount++;
                                // Assign weapon to weapon set 1
                                itemData = foundry.utils.mergeObject(itemData, { 
                                    system: { 
                                        equipped: true,
                                        weaponSet: 1,
                                        activation: { type: "action", cost: 1 }
                                    } 
                                }, { inplace: false });
                                console.log(`FFTweaks | Equipped weapon: ${itemName} to weapon set 1`);
                            } else if (system?.armor?.type === "shield" || itemName.toLowerCase().includes("shield")) {
                                shieldCount++;
                                // Assign shield to weapon set 1 (same as weapon)
                                itemData = foundry.utils.mergeObject(itemData, { 
                                    system: { 
                                        equipped: true,
                                        weaponSet: 1
                                    } 
                                }, { inplace: false });
                                console.log(`FFTweaks | Equipped shield: ${itemName} to weapon set 1`);
                            } else {
                                // Other equipment (like ammunition)
                                itemData = foundry.utils.mergeObject(itemData, { system: { equipped: true } }, { inplace: false });
                                console.log(`FFTweaks | Equipped other item: ${itemName}`);
                            }
                            
                            selectedEquipment.push(itemData);
                        } else {
                            console.warn(`FFTweaks | Could not find item: ${itemName}`);
                        }
                    }
                    
                    console.log(`FFTweaks | Added weapon set: ${weaponSet.name} (${weaponCount} weapons, ${shieldCount} shields)`);
                }
                
                // Generate ranged sets (add to weapon set 2)
                const rangedSet = EquipmentGenerator.selectRandomItem(templateEquipment.rangedSets);
                if (rangedSet) {
                    for (const itemName of rangedSet.items) {
                        const item = await EquipmentGenerator.findItemByName(itemName);
                        if (item) {
                            let itemData = item.toObject();
                            const system = itemData.system as any;
                            const itemType = system?.type?.value;
                            const baseType = system?.type?.baseItem;
                            // D&D 5e weapon types: simpleM, simpleR, martialM, martialR, etc.
                            const isWeapon = itemType === "weapon" || 
                                           itemType?.includes("M") || // Melee weapons (simpleM, martialM)
                                           itemType?.includes("R") || // Ranged weapons (simpleR, martialR)
                                           system?.actionType || 
                                           system?.damage?.parts?.length > 0;
                            
                            console.log(`FFTweaks | Processing ranged item: ${itemName}`);
                            console.log(`FFTweaks | - type.value: ${itemType}`);
                            console.log(`FFTweaks | - type.baseItem: ${baseType}`);
                            console.log(`FFTweaks | - actionType: ${system?.actionType}`);
                            console.log(`FFTweaks | - isWeapon: ${isWeapon}`);
                            
                            if (isWeapon) {
                                // Assign ranged weapon to weapon set 2
                                itemData = foundry.utils.mergeObject(itemData, { 
                                    system: { 
                                        equipped: true,
                                        weaponSet: 2,
                                        activation: { type: "action", cost: 1 }
                                    } 
                                }, { inplace: false });
                                console.log(`FFTweaks | Equipped ranged weapon: ${itemName} to weapon set 2`);
                            } else {
                                // Ammunition and other gear - set quantity based on type
                                let quantity = 1;
                                if (itemName.toLowerCase().includes("bolt") || itemName.toLowerCase().includes("arrow")) {
                                    quantity = 20;
                                } else if (itemName.toLowerCase().includes("javelin")) {
                                    quantity = 1; // Javelins are tracked individually
                                } else if (itemName.toLowerCase().includes("dart") || itemName.toLowerCase().includes("dagger")) {
                                    quantity = 5;
                                }
                                
                                itemData = foundry.utils.mergeObject(itemData, { 
                                    system: { 
                                        equipped: true,
                                        quantity: quantity
                                    } 
                                }, { inplace: false });
                                console.log(`FFTweaks | Equipped ammunition: ${itemName} (quantity: ${quantity})`);
                            }
                            
                            selectedEquipment.push(itemData);
                        } else {
                            console.warn(`FFTweaks | Could not find ranged item: ${itemName}`);
                        }
                    }
                }
                // Generate armor (always equipped)
                const armorItem = EquipmentGenerator.selectRandomItem(templateEquipment.armor);
                if (armorItem) {
                    const item = await EquipmentGenerator.findItemByName(armorItem.name);
                    if (item) {
                        let itemData = item.toObject();
                        itemData = foundry.utils.mergeObject(itemData, { system: { equipped: true } }, { inplace: false });
                        selectedEquipment.push(itemData);
                    }
                }
                // Generate gear
                for (const gearItem of templateEquipment.gear) {
                    if (Math.random() * 100 < gearItem.chance) {
                        const item = await EquipmentGenerator.findItemByName(gearItem.name);
                        if (item) {
                            let itemData = item.toObject();
                            itemData = foundry.utils.mergeObject(itemData, { system: { equipped: false } }, { inplace: false });
                            selectedEquipment.push(itemData);
                        }
                    }
                }
                // Add equipment to actor
                if (selectedEquipment.length > 0) {
                    await actor.createEmbeddedDocuments("Item", selectedEquipment);
                    console.log(`FFTweaks | Generated ${selectedEquipment.length} equipment items for ${actor.name}`);
                }
            } catch (error) {
                console.error("FFTweaks | Error generating equipment:", error);
            }
        }
        
        private static selectRandomItem<T extends { chance: number }>(items: T[]): T | null {
            if (!items || items.length === 0) return null;
            
            const totalWeight = items.reduce((sum, item) => sum + item.chance, 0);
            const random = Math.random() * totalWeight;
            
            let current = 0;
            for (const item of items) {
                current += item.chance;
                if (random <= current) {
                    return item;
                }
            }
            
            return items[items.length - 1];
        }
        
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
        
        static async findWeaponByType(weaponType: string): Promise<Item | null> {
            try {
                // Search in fftweaks.items compendium first
                const fftweaksItemsPack = game.packs.get("fftweaks.items");
                if (fftweaksItemsPack) {
                    await fftweaksItemsPack.getIndex();
                    const entries = fftweaksItemsPack.index.filter((i: any) => 
                        i.name?.toLowerCase().includes(weaponType.toLowerCase())
                    );
                    
                    if (entries.length > 0) {
                        const randomEntry = entries[Math.floor(Math.random() * entries.length)];
                        const document = await fftweaksItemsPack.getDocument(randomEntry._id!);
                        if (document && (document as any).documentName === "Item" && (document as any).system?.type?.value === "weapon") {
                            return document as Item;
                        }
                    }
                }
                
                // Search for weapons of specific type in other compendiums
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item" && pack.collection !== "fftweaks.items") {
                        await pack.getIndex();
                        const entries = pack.index.filter((i: any) => 
                            i.name?.toLowerCase().includes(weaponType.toLowerCase())
                        );
                        
                        if (entries.length > 0) {
                            const randomEntry = entries[Math.floor(Math.random() * entries.length)];
                            const document = await pack.getDocument(randomEntry._id!);
                            if (document && (document as any).documentName === "Item" && (document as any).system?.type?.value === "weapon") {
                                return document as Item;
                            }
                        }
                    }
                }
                
                return null;
                
            } catch (error) {
                console.error(`FFTweaks | Error finding weapon type ${weaponType}:`, error);
                return null;
            }
        }
        
        static async findArmorByType(armorType: string): Promise<Item | null> {
            try {
                // Search in fftweaks.items compendium first
                const fftweaksItemsPack = game.packs.get("fftweaks.items");
                if (fftweaksItemsPack) {
                    await fftweaksItemsPack.getIndex();
                    const entries = fftweaksItemsPack.index.filter((i: any) => 
                        i.name?.toLowerCase().includes(armorType.toLowerCase())
                    );
                    
                    if (entries.length > 0) {
                        const randomEntry = entries[Math.floor(Math.random() * entries.length)];
                        const document = await fftweaksItemsPack.getDocument(randomEntry._id!);
                        if (document && (document as any).documentName === "Item" && (document as any).system?.type?.value === "equipment") {
                            return document as Item;
                        }
                    }
                }
                
                // Search for armor of specific type in other compendiums
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item" && pack.collection !== "fftweaks.items") {
                        await pack.getIndex();
                        const entries = pack.index.filter((i: any) => 
                            i.name?.toLowerCase().includes(armorType.toLowerCase())
                        );
                        
                        if (entries.length > 0) {
                            const randomEntry = entries[Math.floor(Math.random() * entries.length)];
                            const document = await pack.getDocument(randomEntry._id!);
                            if (document && (document as any).documentName === "Item" && (document as any).system?.type?.value === "equipment") {
                                return document as Item;
                            }
                        }
                    }
                }
                
                return null;
                
            } catch (error) {
                console.error(`FFTweaks | Error finding armor type ${armorType}:`, error);
                return null;
            }
        }
    }
}
