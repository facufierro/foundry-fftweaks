import { Debug } from "../../utils/debug";
import { Equipment } from "../equipment";

export class TokenVisuals {
    private static _fileCache = new Map<string, Set<string>>();

    static initialize() {
        // Listen for weapon set changes from the Equipment plugin
        Hooks.on("fftweaks.weaponSetChanged" as any, this.handleWeaponSetChanged);

        // Also listen for item equip/unequip as a fallback trigger
        Hooks.on("updateItem" as any, this.handleTokenEquipmentUpdate);

        Hooks.on("preCreateToken" as any, this.handleTokenSizeScaling);
        Hooks.on("preCreateToken" as any, this.handleTokenNameShortening);
        Hooks.on("preCreateToken" as any, this.handleNPCHiding);
    }

    static handleWeaponSetChanged = async (payload: {
        actor: any;
        activeSet: number;
        primary: any | null;
        secondary: any | null;
    }) => {
        const { actor, primary, secondary } = payload;
        if (!actor || actor.type !== "character") return;
        await TokenVisuals.updateTokenImage(actor, primary, secondary);
    };

    static handleTokenEquipmentUpdate = async (item: any, updateData: any) => {
        const actor = item.actor;
        if (!actor || !updateData?.system?.equipped) return;
        if (actor.type !== "character") return;

        const gameAny = game as any;
        gameAny._tokenImageDebounce ??= {};

        const actorId = actor.id;
        clearTimeout(gameAny._tokenImageDebounce[actorId]);

        gameAny._tokenImageDebounce[actorId] = setTimeout(async () => {
            const weapons = await Equipment.getActiveWeapons(actor);
            await TokenVisuals.updateTokenImage(actor, weapons.primary, weapons.secondary);
        }, 250);
    };

    private static async updateTokenImage(actor: any, primary: any | null, secondary: any | null) {
        const token = actor.getActiveTokens()[0];
        if (!token) return;

        const actorSlug = actor.name.split(" ")[0].slugify();

        // Resolve weapon base types
        const mainHand = primary?.system?.type?.baseItem?.slugify?.() ?? "none";
        const offHand = secondary?.system?.type?.baseItem?.slugify?.() ?? "none";

        // D&D convention: main hand first, off hand second
        const suffix = `${mainHand}-${offHand}`;
        const imageFile = `${actorSlug}-${suffix}.webp`;
        const folderPath = `assets/fftweaks/tokens/Players/${actorSlug}`;
        const imagePath = `${folderPath}/${imageFile}`;

        // Check cache first to avoid FilePicker spam
        let cachedFiles = TokenVisuals._fileCache.get(folderPath);

        if (!cachedFiles) {
            try {
                const result = await FilePicker.browse("data", folderPath);
                cachedFiles = new Set(result.files);
                TokenVisuals._fileCache.set(folderPath, cachedFiles);
            } catch (err) {
                cachedFiles = new Set();
                TokenVisuals._fileCache.set(folderPath, cachedFiles);
            }
        }

        const finalImage = cachedFiles.has(imagePath)
            ? imagePath
            : `${folderPath}/${actorSlug}.webp`;

        if (token && token.document.texture.src !== finalImage) {
            await token.document.update({ texture: { src: finalImage } });
        }

        if (actor.prototypeToken.texture.src !== finalImage) {
            await actor.prototypeToken.update({ texture: { src: finalImage } });
        }
    }

    static handleTokenSizeScaling(tokenDocument: any) {
        Debug.Log("TokenVisuals | handleTokenSizeScaling triggered");
        const actor = tokenDocument.actor;
        if (!actor) {
            Debug.Warn("TokenVisuals | No actor found on tokenDocument");
            return;
        }

        if (actor.type !== "character") {
            Debug.Log(`TokenVisuals | Actor type is ${actor.type}, skipping resize`);
            return;
        }

        const sizeScaleMap: Record<string, number> = {
            "tiny": 1,
            "sm": 1.5,
            "med": 2,
            "lg": 2.5,
            "huge": 3,
            "grg": 3.5
        };

        const sizeKey = actor.system.traits?.size;
        const expectedScale = sizeScaleMap[sizeKey] ?? 2;

        Debug.Log(`TokenVisuals | Size Key: ${sizeKey}, Expected Scale: ${expectedScale}`);

        const currentTexture = tokenDocument.texture ?? {};
        const currentScaleX = currentTexture.scaleX ?? 1;
        const currentScaleY = currentTexture.scaleY ?? 1;

        Debug.Log(`TokenVisuals | Current Scale: ${currentScaleX}, ${currentScaleY}`);

        if (currentScaleX !== expectedScale || currentScaleY !== expectedScale) {
            Debug.Log(`TokenVisuals | Updating token scale to ${expectedScale}`);
            tokenDocument.updateSource({
                texture: {
                    scaleX: expectedScale,
                    scaleY: expectedScale
                }
            });

            actor.prototypeToken.update({
                texture: {
                    scaleX: expectedScale,
                    scaleY: expectedScale
                }
            });
        } else {
            Debug.Log("TokenVisuals | Scale matches, no update needed");
        }
    }

    static handleTokenNameShortening(tokenDocument: any) {
        const actor = tokenDocument.actor;
        if (!actor) return;

        const firstName = actor.name.split(" ")[0];

        tokenDocument.updateSource({ name: firstName });
    }
    static handleNPCHiding(tokenDocument: any, data: any, options: any, userId: any) {
        const actor = tokenDocument.actor;
        if (!actor) return;

        if (actor.type === "npc") {
            tokenDocument.updateSource({ hidden: true });
            if (typeof data === 'object') {
                data.hidden = true;
            }
        }
    }
}
