/**
 * Update image and audio file paths on the active scene
 * @param replacements - Array of [find, replace] pairs (e.g., [["fa_battlemaps", "assets/fftweaks/fa_battlemaps"]])
 */
export async function updateScenePaths(
    replacements: [string, string][]
): Promise<void> {
    const scene = game.scenes?.active;
    if (!scene) {
        ui.notifications?.warn("No active scene found");
        return;
    }

    const fixPath = (path: string | undefined): string | undefined => {
        if (!path || typeof path !== "string") return path;
        
        for (const [find, replace] of replacements) {
            if (path.startsWith(find)) {
                return replace + path.substring(find.length);
            }
        }
        
        return path;
    };

    const fixObject = (obj: any): any => {
        if (!obj || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(fixObject);
        
        const result: any = {};
        for (const key in obj) {
            // Fix known path properties
            if (["img", "src", "texture", "icon", "name", "audiofile", "file", "path"].includes(key)) {
                result[key] = fixPath(obj[key]);
            } else if (typeof obj[key] === "object") {
                result[key] = fixObject(obj[key]);
            } else {
                result[key] = obj[key];
            }
        }
        return result;
    };

    let updateCount = 0;

    // Update background
    if (scene.background?.src) {
        const fixed = fixPath(scene.background.src);
        if (fixed !== scene.background.src) {
            await (scene as any).update({ "background.src": fixed });
            updateCount++;
        }
    }

    // Update foreground
    if (scene.foreground) {
        const fixed = fixPath(scene.foreground as string);
        if (fixed !== scene.foreground) {
            await (scene as any).update({ foreground: fixed });
            updateCount++;
        }
    }

    // Update tiles
    const tileUpdates: any[] = [];
    for (const tile of scene.tiles.contents) {
        const update: any = { _id: tile.id };
        let hasChanges = false;

        if (tile.texture?.src) {
            const fixed = fixPath(tile.texture.src);
            if (fixed !== tile.texture.src) {
                update["texture.src"] = fixed;
                hasChanges = true;
            }
        }

        if ((tile.flags as any)?.[" monks-active-tiles"]) {
            const fixed = fixObject((tile.flags as any)["monks-active-tiles"]);
            if (JSON.stringify(fixed) !== JSON.stringify((tile.flags as any)["monks-active-tiles"])) {
                update["flags.monks-active-tiles"] = fixed;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            tileUpdates.push(update);
        }
    }
    if (tileUpdates.length) {
        await scene.updateEmbeddedDocuments("Tile", tileUpdates);
        updateCount += tileUpdates.length;
    }

    // Update drawings
    const drawingUpdates: any[] = [];
    for (const drawing of scene.drawings.contents) {
        if ((drawing as any).texture?.src) {
            const fixed = fixPath((drawing as any).texture.src);
            if (fixed !== (drawing as any).texture.src) {
                drawingUpdates.push({ _id: drawing.id, "texture.src": fixed });
            }
        }
    }
    if (drawingUpdates.length) {
        await scene.updateEmbeddedDocuments("Drawing", drawingUpdates as any);
        updateCount += drawingUpdates.length;
    }

    // Update notes
    const noteUpdates: any[] = [];
    for (const note of scene.notes.contents) {
        if ((note as any).texture?.src) {
            const fixed = fixPath((note as any).texture.src);
            if (fixed !== (note as any).texture.src) {
                noteUpdates.push({ _id: note.id, "texture.src": fixed });
            }
        }
    }
    if (noteUpdates.length) {
        await scene.updateEmbeddedDocuments("Note", noteUpdates as any);
        updateCount += noteUpdates.length;
    }

    // Update tokens
    const tokenUpdates: any[] = [];
    for (const token of scene.tokens.contents) {
        if ((token as any).texture?.src) {
            const fixed = fixPath((token as any).texture.src);
            if (fixed !== (token as any).texture.src) {
                tokenUpdates.push({ _id: (token as any).id, "texture.src": fixed });
            }
        }
    }
    if (tokenUpdates.length) {
        await scene.updateEmbeddedDocuments("Token", tokenUpdates as any);
        updateCount += tokenUpdates.length;
    }

    // Force refresh tiles to reload textures
    for (const tile of scene.tiles.contents) {
        if ((tile as any).object) await (tile as any).object.draw();
    }

    // Reload scene to clear caches
    await (scene as any).view();

    if (updateCount > 0) {
        ui.notifications?.info(`Updated ${updateCount} scene element(s). Reload page (F5) if issues persist.`);
    } else {
        ui.notifications?.info("No paths needed updating");
    }
}
