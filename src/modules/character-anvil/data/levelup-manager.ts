namespace FFT {
    export class LevelupManager {
        static renderButton(actor: Actor5e, html: JQuery<HTMLElement>) {
            const character = new Character(actor);

            const needsAdvancement = !character.background || !character.species || !character.class;
            if (!needsAdvancement && !character.canLevelUp()) return;

            const buttonHolder = html.find('.xp-label');
            if (!buttonHolder.length || html.find("#fft-spellselector-button").length) return;

            const button = new FFT.CustomButton({
                id: "fft-spellselector-button",
                tooltip: "Level Up",
                iconClass: "fas fa-arrow-alt-circle-up",
                onClick: () => {
                    this.levelUp(character);
                },
                classes: ["fft-levelup-button"] // Optional: CSS class for future styling
            });

            // Attach to the DOM
            buttonHolder.prepend(button.element);
        }

        static async levelUp(character: Character): Promise<void> {
            if (!character.background) {
                await PointBuySystem.renderDialog(character.actor);
                await this.pickItem(character.actor, "background");
            }
            if (!character.species) {
                await this.pickItem(character.actor, "race");
            }
            if (!character.class) {
                await this.pickItem(character.actor, "class");
            } else {
                await this.levelClass(character);
            }
        }

        static async pickItem(actor: Actor5e, type: "class" | "background" | "race"): Promise<void> {
            const sheet = actor.sheet as any;

            if (typeof sheet._onFindItem !== "function") {
                ui.notifications.warn(`Cannot open ${type} selector: unsupported sheet.`);
                return;
            }

            return new Promise<void>((resolve) => {
                const createdHook = Hooks.once("createItem", async (item: Item5e) => {
                    if (item.parent?.id !== actor.id || item.type !== type) return resolve();
                    Hooks.once("dnd5e.advancementManagerComplete", () => resolve());
                });

                const originalMethod = sheet._onFindItem;
                sheet._onFindItem = function (patchType: string, options: any = {}) {
                    if (patchType === "class" && options.classIdentifier) {
                        delete options.classIdentifier;
                    }
                    return originalMethod.call(this, patchType, options);
                };
                sheet._onFindItem(type);
                setTimeout(() => {
                    sheet._onFindItem = originalMethod;
                }, 0);
            });
        }

        static async levelClass(character: Character): Promise<void> {
            const actor = character.actor;
            const classItem = character.class;
            if (!actor || !classItem) return;

            const newItemData = classItem.toObject();
            const [created] = await actor.createEmbeddedDocuments("Item", [newItemData]) as unknown as Item5e[];

            if (created) {
                const manager = await dnd5e.applications.advancement.AdvancementManager.forModifyChoices(actor, created.id, 1);
                if (manager?.steps?.length) {
                    await new Promise<void>((resolve) => {
                        const hookId = Hooks.once("dnd5e.advancementManagerComplete", () => {
                            resolve();
                        });
                        manager.render(true);
                    });
                }
            }
        }
    }
}
