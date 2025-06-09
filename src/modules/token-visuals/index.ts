namespace FFT {
    export class TokenVisualsModule {
        static initialize() {
            Hooks.on("updateItem", this.handleTokenEquipmentUpdate);
            Hooks.on("createToken", this.handleTokenSizeScaling);
            Hooks.on("createToken", this.handleTokenNameShortening);  // New hook
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

                const hudRoot = document.querySelector(".extended-combat-hud");
                const activeSet = hudRoot?.querySelector(".weapon-set.active");
                if (!activeSet) {
                    console.warn("[FFT] No active weapon set found in HUD.");
                    return;
                }

                const extractSlotItem = (slotClass: string): string | null => {
                    const slot = activeSet.querySelector(`.set-${slotClass}`) as HTMLElement;
                    const bg = slot?.style.backgroundImage;
                    const match = bg?.match(/\/([^\/]+\.webp)/);
                    const imgPath = match?.[1];
                    console.log(`[FFT] Slot "${slotClass}" background image: ${bg}`);
                    console.log(`[FFT] Extracted image filename: ${imgPath}`);

                    const itemMatch = actor.items.find(i =>
                        i.img.includes(imgPath) &&
                        i.system?.equipped
                    );

                    if (!itemMatch) {
                        console.warn(`[FFT] No equipped item found for image ${imgPath} in slot ${slotClass}`);
                        return "none";
                    }

                    const base = itemMatch.system?.type?.baseItem;
                    console.log(`[FFT] Matched item: ${itemMatch.name}, baseItem: ${base}`);
                    return base?.slugify?.() ?? "none";
                };

                const right = extractSlotItem("primary");
                const left = extractSlotItem("secondary");

                const suffix = [right ?? "none", left ?? "none"].join("_");
                const imageFile = `${actorSlug}_${suffix}.webp`;
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

        static async handleTokenSizeScaling(tokenDocument: any) {
            const actor = tokenDocument.actor;
            if (!actor) return;

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
                await Promise.all([
                    tokenDocument.update({
                        texture: {
                            scaleX: expectedScale,
                            scaleY: expectedScale
                        }
                    }),
                    actor.prototypeToken.update({
                        texture: {
                            scaleX: expectedScale,
                            scaleY: expectedScale
                        }
                    })
                ]);
            }
        }

        static async handleTokenNameShortening(tokenDocument: any) {
            const actor = tokenDocument.actor;
            if (!actor) return;

            const firstName = actor.name.split(" ")[0];

            await tokenDocument.update({ name: firstName });
        }
    }
}
