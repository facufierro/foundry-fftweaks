namespace FFT {
    export class TokenVisualsModule {
        static initialize() {
            Hooks.on("updateItem", this.handleTokenEquipmentUpdate);
            Hooks.on("createToken", this.handleTokenSizeScaling);
        }

        static async handleTokenEquipmentUpdate(item: any, updateData: any) {
            const actor = item.actor;
            if (!actor || !hasProperty(updateData, "system.equipped")) return;

            const gameAny = game as any;
            gameAny._tokenImageDebounce ??= {};

            const actorId = actor.id;
            clearTimeout(gameAny._tokenImageDebounce[actorId]);

            gameAny._tokenImageDebounce[actorId] = setTimeout(async () => {
                const token = actor.getActiveTokens()[0];
                if (!token) return;

                const actorSlug = actor.name.split(" ")[0].slugify();

                const hudRoot = document.querySelector(".extended-combat-hud");
                const activeSet = hudRoot?.querySelector(".weapon-set.active");
                if (!activeSet) return;

                const extractSlotItem = (slotClass: string): string | null => {
                    const slot = activeSet.querySelector(`.set-${slotClass}`) as HTMLElement;
                    const bg = slot?.style.backgroundImage;
                    const match = bg?.match(/\/([^\/]+\.webp)/);
                    const imgPath = match?.[1];
                    return actor.items.find(i => i.img.includes(imgPath) && getProperty(i, "system.equipped"))?.name?.slugify() ?? null;
                };

                const right = extractSlotItem("primary");
                const left = extractSlotItem("secondary");

                const suffix = [right ?? "none", left].filter(Boolean).join("_");
                const imageFile = `${actorSlug}${suffix ? `_${suffix}` : ""}.webp`;
                const folderPath = `assets/fftweaks/tokens/Players/${actorSlug}`;
                const imagePath = `${folderPath}/${imageFile}`;

                const files = await FilePicker.browse("data", folderPath);
                const finalImage = files.files.includes(imagePath)
                    ? imagePath
                    : `${folderPath}/${actorSlug}.webp`;

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
                // Update both token and prototype token
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


    }
}
