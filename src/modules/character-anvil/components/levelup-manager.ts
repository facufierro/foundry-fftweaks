namespace FFT {

    export class LevelupManager {
        static renderButton(actor: Actor5e, html: JQuery<HTMLElement>) {
            const character = new Character(actor);

            const needsAdvancement = !character.background || !character.species || !character.class;
            if (!needsAdvancement && !character.canLevelUp()) return;

            const buttonHolder = html.find('.xp-label');
            if (!buttonHolder.length || html.find("#fft-custom-button").length) return;

            const button = new FFT.CustomButton({
                id: "fft-spellselector-button",
                tooltip: "Level Up",
                iconClass: "fas fa-arrow-alt-circle-up",
                onClick: () => {
                    this.levelUp(character);
                    console.log((actor.sheet as any)._onFindItem.toString());

                }
            });

            button.prependTo(buttonHolder);
        }

        static async levelUp(character: Character): Promise<void> {
            // if no background, render point buy dialog then pickBackground
            if (!character.background) {
                await PointBuySystem.renderDialog(character.actor);
                await this.pickItem(character.actor, "background");

            }
            // if no species, pickSpecies
            if (!character.species) {
                await this.pickItem(character.actor, "race");

            }
            // if no class, pickClass
            if (character.canLevelUp()) {
                await this.pickItem(character.actor, "class");
            }
        }
        static async pickItem(actor: Actor5e, type: "class" | "background" | "race"): Promise<void> {

            const sheet = actor.sheet as any;
            if (typeof sheet._onFindItem !== "function") {
                ui.notifications.warn(`Cannot open ${type} selector: unsupported sheet.`);
                return;
            }

            return new Promise<void>((resolve) => {
                // Listen for the new item being created
                const createdHook = Hooks.once("createItem", async (item: Item5e) => {
                    if (item.parent?.id !== actor.id || item.type !== type) return resolve();

                    // Wait for the advancement dialog to complete
                    Hooks.once("dnd5e.advancementManagerComplete", () => {
                        resolve();
                    });
                });

                // Trigger the compendium browser
                sheet._onFindItem(type);
            });
        }
        static async waitForAdvancement(): Promise<void> {
            await new Promise<void>((resolve) => {
                Hooks.once("dnd5e.advancementManagerComplete", resolve);
            });
        }

    }
}