namespace FFT.Modules {
    export class PointBuy {
        static initialize(): void {
            Hooks.on("renderActorSheet5eCharacter", (_app, html, data) => {
                if (!game.user.isGM) return;

                // Find the rest buttons container
                let buttonContainer = html.find(".sheet-header-buttons");
                if (!buttonContainer.length) return;

                // Create the Point Buy button
                let button = $(`
                    <button type="button" class="point-buy-button gold-button" 
                        data-tooltip="Point Buy System" aria-label="Point Buy">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                `);

                // Add click event to open the Point Buy dialog
                button.on("click", () => PointBuy.openDialog(data.actor));

                // Append the button next to the rest buttons
                buttonContainer.append(button);
            });
        }

        static openDialog(actor: Actor): void {
            let abilities = (actor as any).system.abilities;
            let currentPoints = PointBuy.calculatePoints(abilities);
            let abilityLabels = (CONFIG as any)["DND5E"].abilities;
            let content = PointBuy.generateDialogContent(abilities, abilityLabels, currentPoints);

            new Dialog({
                title: "Point Buy System",
                content: content,
                buttons: {
                    confirm: {
                        label: "Apply",
                        callback: (html) => PointBuy.applyChanges(actor, $(html))
                    },
                    cancel: {
                        label: "Cancel"
                    }
                }
            }).render(true);
        }

        static generateDialogContent(abilities: any, abilityLabels: Record<string, string>, currentPoints: number): string {
            let content = `<p>Remaining Points: <span id="remaining-points">${currentPoints}</span></p>`;
            for (let [key, ability] of Object.entries(abilities) as [string, { value: number }][]) {
                content += `
                    <label>${abilityLabels[key] || key}</label>
                    <input type="number" id="ability-${key}" value="${ability.value}" min="8" max="15">
                `;
            }
            return content;
        }

        static calculatePoints(abilities: any): number {
            let total = 27;
            let costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
            for (let [key, ability] of Object.entries(abilities) as [string, { value: number }][]) {
                total -= costs[ability.value] || 0;
            }
            return total;
        }

        static applyChanges(actor: Actor, html: JQuery): void {
            let updates: Record<string, number> = {};
            let remainingPoints = 27;
            let costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

            for (let key in (actor as any).system.abilities) {
                let input = html.find(`#ability-${key}`);
                let newValue = parseInt(input.val() as string);
                if (isNaN(newValue) || newValue < 8 || newValue > 15) return;

                remainingPoints -= costs[newValue] || 0;
                updates[`system.abilities.${key}.value`] = newValue;
            }

            if (remainingPoints < 0) {
                ui.notifications.error("Invalid point allocation. Please stay within the 27 points.");
                return;
            }

            actor.update(updates);
            ui.notifications.info("Abilities updated successfully.");
        }
    }
}
