/**
 * Item Replacer: Automatically updates all items from a character with the same items from fftweaks compendiums
 * Supports the following compendiums: backgrounds, classes, feats, items, species, spells
 */

interface ItemReplacementOptions {
    /** Array of actor IDs to update. If not provided, will use selected tokens or prompt user */
    actorIds?: string[];
    /** Whether to show detailed progress notifications */
    showProgress?: boolean;
    /** Whether to preserve custom modifications on items */
    preserveCustomizations?: boolean;
    /** Array of compendium names to check. Defaults to all fftweaks compendiums */
    compendiums?: string[];
}

interface ItemReplacementResult {
    success: boolean;
    actorName: string;
    itemsReplaced: number;
    itemsSkipped: number;
    errors: string[];
}

const DEFAULT_COMPENDIUMS = [
    "fftweaks.backgrounds",
    "fftweaks.classes", 
    "fftweaks.feats",
    "fftweaks.items",
    "fftweaks.species",
    "fftweaks.spells"
];

/**
 * Main item replacement function
 */
async function replaceItemsFromCompendiums(options: ItemReplacementOptions = {}): Promise<ItemReplacementResult[]> {
    const {
        actorIds,
        showProgress = true,
        preserveCustomizations = true,
        compendiums = DEFAULT_COMPENDIUMS
    } = options;

    // Get target actors
    const actors = await getTargetActors(actorIds);
    if (!actors.length) {
        ui.notifications?.warn("FFTweaks | No actors selected for item replacement.");
        return [];
    }

    // Load compendium indices for faster lookups
    if (showProgress) {
        ui.notifications?.info("FFTweaks | Loading compendium data...");
    }
    
    const compendiumData = await loadCompendiumData(compendiums);
    if (!compendiumData.size) {
        ui.notifications?.error("FFTweaks | No valid compendiums found.");
        return [];
    }

    const results: ItemReplacementResult[] = [];

    // Process each actor
    for (let i = 0; i < actors.length; i++) {
        const actor = actors[i];
        
        if (showProgress) {
            ui.notifications?.info(`FFTweaks | Processing ${actor.name} (${i + 1}/${actors.length})...`);
        }

        const result = await replaceActorItems(actor, compendiumData, preserveCustomizations);
        results.push(result);
    }

    // Show summary
    const totalReplaced = results.reduce((sum, r) => sum + r.itemsReplaced, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    
    if (showProgress) {
        if (totalErrors > 0) {
            ui.notifications?.warn(`FFTweaks | Replacement complete. ${totalReplaced} items replaced with ${totalErrors} errors.`);
        } else {
            ui.notifications?.info(`FFTweaks | Replacement complete. ${totalReplaced} items successfully replaced.`);
        }
    }

    return results;
}

/**
 * Get target actors based on provided IDs, selected tokens, or user selection
 */
async function getTargetActors(actorIds?: string[]): Promise<Actor[]> {
    // If actor IDs provided, use those
    if (actorIds?.length) {
        return actorIds.map(id => game.actors?.get(id)).filter(Boolean) as Actor[];
    }

    // Try to get from selected tokens
    const selectedTokens = canvas.tokens?.controlled || [];
    if (selectedTokens.length > 0) {
        const actors = selectedTokens.map(token => token.actor).filter(Boolean) as Actor[];
        if (actors.length > 0) {
            return actors;
        }
    }

    // Prompt user to select actors
    return await promptActorSelection();
}

/**
 * Show dialog to let user select actors
 */
async function promptActorSelection(): Promise<Actor[]> {
    const actors = game.actors?.filter(actor => actor.isOwner) || [];
    
    if (!actors.length) {
        ui.notifications?.warn("FFTweaks | No actors available for selection.");
        return [];
    }

    return new Promise((resolve) => {
        const options = actors.map(actor => `<option value="${actor.id}">${actor.name}</option>`).join("");
        
        const content = `
            <form>
                <div class="form-group">
                    <label>Select actors to update:</label>
                    <select name="actors" multiple style="height: 200px; width: 100%;">
                        ${options}
                    </select>
                </div>
                <p><em>Hold Ctrl/Cmd to select multiple actors</em></p>
            </form>
        `;

        new Dialog({
            title: "FFTweaks - Select Actors for Item Replacement",
            content,
            buttons: {
                ok: {
                    label: "Replace Items",
                    callback: (html: JQuery) => {
                        const selectedIds = (html.find('[name="actors"]').val() as string[]) || [];
                        const selectedActors = selectedIds.map(id => game.actors?.get(id)).filter(Boolean) as Actor[];
                        resolve(selectedActors);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve([])
                }
            },
            default: "ok"
        }).render(true);
    });
}

/**
 * Load and index compendium data for fast lookups
 */
async function loadCompendiumData(compendiumNames: string[]): Promise<Map<string, CompendiumDocument[]>> {
    const compendiumData = new Map<string, CompendiumDocument[]>();

    for (const packName of compendiumNames) {
        const pack = game.packs?.get(packName);
        if (!pack) {
            console.warn(`FFTweaks | Compendium '${packName}' not found.`);
            continue;
        }

        try {
            // Get all documents from the compendium
            const documents = await pack.getDocuments();
            
            // Index by name for faster lookups
            const indexedDocs: CompendiumDocument[] = [];
            for (const doc of documents) {
                indexedDocs.push({
                    name: doc.name,
                    uuid: doc.uuid,
                    document: doc,
                    type: (doc as any).type || doc.documentName
                });
            }

            compendiumData.set(packName, indexedDocs);
            console.log(`FFTweaks | Loaded ${indexedDocs.length} items from ${packName}`);
        } catch (error) {
            console.error(`FFTweaks | Error loading compendium '${packName}':`, error);
        }
    }

    return compendiumData;
}

interface CompendiumDocument {
    name: string;
    uuid: string;
    document: any;
    type?: string;
}

/**
 * Replace items for a single actor
 */
async function replaceActorItems(
    actor: Actor, 
    compendiumData: Map<string, CompendiumDocument[]>, 
    preserveCustomizations: boolean
): Promise<ItemReplacementResult> {
    const result: ItemReplacementResult = {
        success: true,
        actorName: actor.name || "Unknown Actor",
        itemsReplaced: 0,
        itemsSkipped: 0,
        errors: []
    };

    if (!actor.items) {
        result.errors.push("Actor has no items collection");
        result.success = false;
        return result;
    }

    const itemsToUpdate: any[] = [];
    const itemsToDelete: string[] = [];

    // Process each item on the actor
    for (const item of actor.items) {
        try {
            const replacement = findReplacementItem(item, compendiumData);
            
            if (replacement) {
                // Prepare replacement data
                const newItemData = await prepareReplacementData(
                    item, 
                    replacement.document, 
                    preserveCustomizations
                );

                if (newItemData) {
                    itemsToDelete.push(item.id);
                    itemsToUpdate.push(newItemData);
                    result.itemsReplaced++;
                } else {
                    result.itemsSkipped++;
                }
            } else {
                result.itemsSkipped++;
            }
        } catch (error) {
            result.errors.push(`Error processing item '${item.name}': ${error}`);
            result.itemsSkipped++;
        }
    }

    // Apply updates
    try {
        if (itemsToDelete.length > 0) {
            await actor.deleteEmbeddedDocuments("Item", itemsToDelete);
        }
        
        if (itemsToUpdate.length > 0) {
            await actor.createEmbeddedDocuments("Item", itemsToUpdate);
        }
    } catch (error) {
        result.errors.push(`Error updating actor: ${error}`);
        result.success = false;
    }

    return result;
}

/**
 * Find replacement item in compendiums
 */
function findReplacementItem(
    originalItem: any, 
    compendiumData: Map<string, CompendiumDocument[]>
): CompendiumDocument | null {
    const itemName = originalItem.name;
    const itemType = (originalItem as any).type || originalItem.documentName;

    // Search through all compendiums
    for (const [packName, documents] of compendiumData) {
        const match = documents.find(doc => {
            const nameMatch = doc.name === itemName;
            const typeMatch = !doc.type || !itemType || doc.type === itemType;
            return nameMatch && typeMatch;
        });
        
        if (match) {
            return match;
        }
    }

    return null;
}

/**
 * Prepare replacement item data, optionally preserving customizations
 */
async function prepareReplacementData(
    originalItem: any,
    replacementItem: any,
    preserveCustomizations: boolean
): Promise<any | null> {
    try {
        // Get the base data from the compendium item
        const newItemData = game.items?.fromCompendium(replacementItem) || replacementItem.toObject();
        
        if (!newItemData) {
            return null;
        }

        // Preserve certain fields if requested
        if (preserveCustomizations && originalItem) {
            // Preserve item quantity and equipped status
            if (originalItem.system?.quantity !== undefined) {
                foundry.utils.setProperty(newItemData, "system.quantity", originalItem.system.quantity);
            }
            
            if (originalItem.system?.equipped !== undefined) {
                foundry.utils.setProperty(newItemData, "system.equipped", originalItem.system.equipped);
            }

            // Preserve attunement status
            if (originalItem.system?.attunement !== undefined) {
                foundry.utils.setProperty(newItemData, "system.attunement", originalItem.system.attunement);
            }

            // Preserve prepared status for spells
            if (originalItem.system?.preparation?.prepared !== undefined) {
                foundry.utils.setProperty(newItemData, "system.preparation.prepared", originalItem.system.preparation.prepared);
            }

            // Preserve uses if they exist
            if (originalItem.system?.uses?.value !== undefined) {
                foundry.utils.setProperty(newItemData, "system.uses.value", originalItem.system.uses.value);
            }

            // Preserve custom description if it was modified
            if (originalItem.system?.description?.value && 
                originalItem.system.description.value !== replacementItem.system?.description?.value) {
                // Only preserve if it looks like a user modification
                const originalDesc = originalItem.system.description.value;
                const compendiumDesc = replacementItem.system?.description?.value || "";
                
                if (originalDesc.length > compendiumDesc.length * 1.1) {
                    foundry.utils.setProperty(newItemData, "system.description.value", originalDesc);
                }
            }
        }

        return newItemData;
    } catch (error) {
        console.error("FFTweaks | Error preparing replacement data:", error);
        return null;
    }
}

/**
 * Convenience function to replace items for all player characters
 */
async function replaceItemsForAllPlayers(options: Omit<ItemReplacementOptions, 'actorIds'> = {}): Promise<ItemReplacementResult[]> {
    const playerActors = game.actors?.filter(actor => 
        actor.hasPlayerOwner && actor.isOwner
    ) || [];

    const actorIds = playerActors.map(actor => actor.id);

    return replaceItemsFromCompendiums({ ...options, actorIds });
}
