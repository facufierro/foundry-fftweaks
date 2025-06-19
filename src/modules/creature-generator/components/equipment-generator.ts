namespace FFT {
    export class EquipmentGenerator {
        static async generateEquipment(templateEquipment: Equipment, actor: Actor): Promise<void> {
            try {
                const selectedEquipment: Item[] = [];
                
                // Generate weapon sets
                const weaponSet = this.selectRandomItem(templateEquipment.weaponSets);
                if (weaponSet) {
                    for (const itemName of weaponSet.items) {
                        const item = await this.findItemByName(itemName);
                        if (item) selectedEquipment.push(item);
                    }
                }
                
                // Generate ranged sets
                const rangedSet = this.selectRandomItem(templateEquipment.rangedSets);
                if (rangedSet) {
                    for (const itemName of rangedSet.items) {
                        const item = await this.findItemByName(itemName);
                        if (item) selectedEquipment.push(item);
                    }
                }
                
                // Generate armor
                const armorItem = this.selectRandomItem(templateEquipment.armor);
                if (armorItem) {
                    const item = await this.findItemByName(armorItem.name);
                    if (item) selectedEquipment.push(item);
                }
                
                // Generate gear
                for (const gearItem of templateEquipment.gear) {
                    if (Math.random() * 100 < gearItem.chance) {
                        const item = await this.findItemByName(gearItem.name);
                        if (item) selectedEquipment.push(item);
                    }
                }
                
                // Add equipment to actor
                if (selectedEquipment.length > 0) {
                    await actor.createEmbeddedDocuments("Item", selectedEquipment.map(item => item.toObject()));
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
                // Search in world items first
                let item = game.items?.find((i: any) => i.name?.toLowerCase() === itemName.toLowerCase());
                if (item) return item;
                
                // Search in compendiums
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item") {
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
                // Search for weapons of specific type in compendiums
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item") {
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
                // Search for armor of specific type in compendiums
                for (const pack of game.packs) {
                    if (pack.metadata.type === "Item") {
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
