import { Debug } from "../../utils/debug";

declare const dnd5e: any;
declare const game: any;

export class ContainerAdvancement {
    static initialize(): void {
        console.log("FFTweaks | ContainerAdvancement | initialize called");
        // We are already in the 'ready' hook from main.ts, so just run.
        ContainerAdvancement.patchItemGrant();
    }

    static patchItemGrant(): void {
        console.log("FFTweaks | ContainerAdvancement | patchItemGrant start");
        try {
            // Safe access to dnd5e global
            if (typeof dnd5e === 'undefined') {
                console.error("FFTweaks | ContainerAdvancement | dnd5e global is undefined!");
                return;
            }

            // Try to find the ItemGrant advancement class.
            // In dnd5e v3+, it's often ItemGrantAdvancement. 
            // We check both for compatibility or just the new one found in logs.
            let ItemGrant = foundry.utils.getProperty(dnd5e, "documents.advancement.ItemGrantAdvancement");
            let className = "ItemGrantAdvancement";

            if (!ItemGrant) {
                // Fallback for older versions?
                ItemGrant = foundry.utils.getProperty(dnd5e, "documents.advancement.ItemGrant");
                className = "ItemGrant";
            }

            if (!ItemGrant) {
                console.error("FFTweaks | ContainerAdvancement | Could not find ItemGrantAdvancement or ItemGrant class to patch.");
                return;
            }

            console.log(`FFTweaks | ContainerAdvancement | Found ${className}:`, ItemGrant);

            const descriptor = `dnd5e.documents.advancement.${className}.prototype.apply`;
            const libWrapper = (game as any).modules.get("lib-wrapper");

            if (libWrapper?.active) {
                console.log("FFTweaks | ContainerAdvancement | Registering libWrapper override");
                
                (globalThis as any).libWrapper.register("fftweaks", descriptor, async function (this: any, ...args: any[]) {
                    const [wrapped, ...originalArgs] = args;
                    const [level] = originalArgs; // level, data, retainedData

                    console.log(`FFTweaks | ContainerAdvancement | ${className}.apply (libWrapped) triggered for level ${level}`);

                    // 1. Run original
                    const updates = await wrapped(...originalArgs);
                    
                    // 2. Container logic
                    await ContainerAdvancement.processUpdates(this, updates);
                    
                    return updates;
                }, "WRAPPER");
                
                console.log("FFTweaks | ContainerAdvancement | libWrapper registered successfully");

            } else {
                console.log("FFTweaks | ContainerAdvancement | libWrapper not active, using direct prototype patch.");
                const originalApply = ItemGrant.prototype.apply;
                
                ItemGrant.prototype.apply = async function(level: number, data: any, retainedData: any = {}) {
                    console.log(`FFTweaks | ContainerAdvancement | ${className}.apply (direct) patch triggered for level ${level}`);

                    // 1. Run original
                    const updates = await originalApply.call(this, level, data, retainedData);
                    
                    // 2. Container logic
                    await ContainerAdvancement.processUpdates(this, updates);
                    
                    return updates;
                };
                console.log("FFTweaks | ContainerAdvancement | Direct patch applied successfully");
            }
        } catch (err) {
            console.error("FFTweaks | ContainerAdvancement | Error in patchItemGrant:", err);
        }
    }

    /**
     * Process updates from ItemGrantAdvancement.apply to handle container contents.
     * 
     * CRITICAL INSIGHT: dnd5e's apply() uses this.actor.updateSource({items}) — a LOCAL
     * in-memory update. The AdvancementManager saves all changes at the end.
     * Item.create() / createEmbeddedDocuments() are IGNORED in this pipeline.
     * We must use the same updateSource pattern.
     */
    static async processUpdates(advancementInstance: any, updates: any) {
        if (!updates) return;
        console.log("FFTweaks | ContainerAdvancement | processUpdates", updates);

        const actor = advancementInstance.actor;
        if (!actor) {
            console.error("FFTweaks | ContainerAdvancement | No actor found on advancement instance");
            return;
        }

        // updates is a map of { newActorItemId: sourceCompendiumUuid }
        for (const [createdItemId, sourceUuid] of Object.entries(updates)) {
            try {
                // Fetch the source item from compendium to check if it's a container
                const sourceItem = await fromUuid(sourceUuid as string);
                if (!sourceItem) {
                    console.warn(`FFTweaks | Source item not found for UUID: ${sourceUuid}`);
                    continue;
                }

                if (sourceItem.type !== 'container') continue;

                console.log(`FFTweaks | Container detected: ${sourceItem.name} (actor item ID: ${createdItemId})`);

                // Access contents from system.contents (returns Collection of Item5e)
                const contents = await sourceItem.system.contents;

                if (!contents || contents.size === 0) {
                    console.log(`FFTweaks | Container ${sourceItem.name} has no contents.`);
                    continue;
                }

                console.log(`FFTweaks | Processing ${contents.size} contents for: ${sourceItem.name}`);

                // Build item data array using the same pattern as dnd5e's createItemData
                const contentItemsData: any[] = [];
                for (const containedItem of contents) {
                    try {
                        // Follow dnd5e's createItemData pattern (line 14063 of dnd5e.mjs):
                        // 1. Get _stats from fromCompendium
                        const { _stats } = (game as any).items.fromCompendium(containedItem);
                        
                        // 2. Clone with flags and new ID, then convert to plain object
                        const itemData = containedItem.clone({
                            _stats,
                            _id: foundry.utils.randomID(),
                            "flags.dnd5e.sourceId": containedItem.uuid,
                            // Link to the container on the actor
                            "system.container": createdItemId
                        }, { keepId: true }).toObject();

                        contentItemsData.push(itemData);
                        console.log(`FFTweaks | Prepared item: ${containedItem.name} -> container ${createdItemId}`);
                    } catch (error) {
                        console.error(`FFTweaks | Error preparing contained item: ${containedItem.name}`, error);
                    }
                }

                if (contentItemsData.length > 0) {
                    // Use updateSource — the SAME method dnd5e uses internally
                    // This adds items to the local actor data, and the AdvancementManager will save them
                    actor.updateSource({ items: contentItemsData });
                    console.log(`FFTweaks | Added ${contentItemsData.length} items via updateSource for ${sourceItem.name}`);
                }
            } catch (error) {
                console.error(`FFTweaks | Error processing container ${createdItemId}`, error);
            }
        }
    }
}
