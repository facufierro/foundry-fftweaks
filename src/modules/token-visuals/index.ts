namespace FFT {
    export class TokenVisualsModule {
        static initialize() {
            Hooks.on("updateItem", this.handleTokenEquipmentUpdate);
            Hooks.on("preCreateToken", this.handleTokenSizeScaling);
            Hooks.on("preCreateToken", this.handleTokenNameShortening);
            Hooks.on("preCreateToken", this.handleNPCHiding);
        }

        static async handleTokenEquipmentUpdate(item: any, updateData: any) {
            const actor = item.actor;
            if (!actor || !updateData?.system?.equipped) return;

            const gameAny = game as any;
            gameAny._tokenImageDebounce ??= {};

            const actorId = actor.id;
            clearTimeout(gameAny._tokenImageDebounce[actorId]);

            gameAny._tokenImageDebounce[actorId] = setTimeout(async () => {
                const token = actor.getActiveTokens()[0];
                if (!token) return;

                const actorSlug = actor.name.split(" ")[0].slugify();
                console.log(`[FFT] Updating token image for: ${actor.name} (${actorSlug})`);

                // Use BG3 hotbar and detect the active weapon set
                const hudRoot = document.getElementById("bg3-hotbar-container");
                const weaponContainer = hudRoot?.querySelector(".bg3-weapon-container") as HTMLElement;
                let activeSetIndex = "0";
                if (weaponContainer) {
                    activeSetIndex = weaponContainer.getAttribute("data-active-set") || "0";
                }
                const activeSet = hudRoot?.querySelector(`.bg3-weapon-set[data-container-index='${activeSetIndex}']`);
                if (!activeSet) {
                    console.warn(`[FFT] No active weapon set found in BG3 hotbar (index ${activeSetIndex}).`);
                    return;
                }

                const extractSlotItem = (slotIndex: number): string | null => {
                    // Find the hotbar cell for the slot
                    const slot = activeSet.querySelector(`.hotbar-cell[data-slot='${slotIndex}-0']`) as HTMLElement;
                    const img = slot?.querySelector("img.hotbar-item") as HTMLImageElement;
                    if (!img || !img.src) {
                        console.log(`[FFT] Slot ${slotIndex} image is empty.`);
                        return "none";
                    }
                    // Extract the filename from the image src
                    const match = img.src.match(/\/([^\/]+\.webp)/);
                    const imgPath = match?.[1];
                    console.log(`[FFT] Slot ${slotIndex} image src: ${img?.src}`);
                    console.log(`[FFT] Extracted image filename: ${imgPath}`);

                    if (!imgPath) {
                        return "none";
                    }

                    const itemMatch = actor.items.find(i =>
                        i.img.includes(imgPath) &&
                        i.system?.equipped
                    );

                    if (!itemMatch) {
                        console.warn(`[FFT] No equipped item found for image ${imgPath} in slot ${slotIndex}`);
                        return "none";
                    }

                    // Use the base weapon type for the image filename
                    const baseItem = itemMatch.system?.type?.baseItem;
                    const baseWeaponType = baseItem?.slugify?.() ?? "none";
                    console.log(`[FFT] Matched item: ${itemMatch.name}, baseItem: ${baseItem}, slugified: ${baseWeaponType}`);
                    return baseWeaponType;
                };

                const right = extractSlotItem(0); // primary weapon slot
                const left = extractSlotItem(1);  // secondary/shield slot

                const rightFinal = right && right !== "" ? right : "none";
                const leftFinal = left && left !== "" ? left : "none";
                const suffix = `${rightFinal}-${leftFinal}`;
                const imageFile = `${actorSlug}-${suffix}.webp`;
                const folderPath = `assets/fftweaks/tokens/Players/${actorSlug}`;
                const imagePath = `${folderPath}/${imageFile}`;

                console.log(`[FFT] Attempting to load image: ${imagePath}`);

                const files = await FilePicker.browse("data", folderPath);
                const finalImage = files.files.includes(imagePath)
                    ? imagePath
                    : `${folderPath}/${actorSlug}.webp`;

                if (finalImage !== imagePath) {
                    console.warn(`[FFT] Image not found: ${imagePath}. Falling back to: ${finalImage}`);
                } else {
                    console.log(`[FFT] Image found: ${finalImage}`);
                }

                if (token) {
                    await token.document.update({ texture: { src: finalImage } });
                }
                await actor.prototypeToken.update({ texture: { src: finalImage } });

            }, 100);
        }

        static handleTokenSizeScaling(tokenDocument: any) {
            const actor = tokenDocument.actor;
            if (!actor) return;

            // Only resize player characters
            if (actor.type !== "character") return;

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

            const currentTexture = tokenDocument.texture ?? {};
            const currentScaleX = currentTexture.scaleX ?? 1;
            const currentScaleY = currentTexture.scaleY ?? 1;

            if (currentScaleX !== expectedScale || currentScaleY !== expectedScale) {
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
                // Ensure data is updated as well, covering both document source and initial data object
                if (typeof data === 'object') {
                    data.hidden = true; 
                }
            }
        }    }
}
