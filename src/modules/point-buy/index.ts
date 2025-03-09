namespace FFT.Modules {
    export class PointBuy {
        private static activeDialog: Dialog | null = null; // ✅ Prevents multiple windows

        static initialize(): void {
            Hooks.on("renderActorSheet5eCharacter", (_app, html, data) => {
                if (!game.user.isGM) return;

                let actor = data.actor as Actor;
                let details = (actor.system.details as any) || {}; // ✅ Fix: Ensure details is treated as an object

                if (details.background) return; // ✅ Now TypeScript won't complain

                let buttonContainer = html.find(".sheet-header-buttons");
                if (!buttonContainer.length) return;

                let button = $(`
                    <button type="button" class="point-buy-button gold-button" 
                        data-tooltip="Point Buy System" aria-label="Point Buy">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                `);

                button.on("click", () => PointBuy.openDialog(actor));
                buttonContainer.append(button);
            });
        }


        static openDialog(actor: Actor): void {
            // ✅ Prevent opening multiple windows
            if (this.activeDialog) {
                this.activeDialog.bringToTop();
                return;
            }

            let abilities: Record<string, number> = {
                str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8
            };
            let currentPoints = this.calculatePoints(abilities);
            let abilityLabels = (CONFIG as any)["DND5E"].abilities;
            let content = this.generateDialogContent(abilities, abilityLabels, currentPoints);

            this.activeDialog = new Dialog({
                title: "Point Buy System",
                content: content,
                render: (html: JQuery<HTMLElement>) => this.setupListeners(html, abilities),
                buttons: {
                    confirm: {
                        label: "Apply",
                        callback: (html) => this.applyChanges(actor, $(html))
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => { this.activeDialog = null; } // ✅ Clears reference when closed
                    }
                },
                close: () => { this.activeDialog = null; } // ✅ Ensures cleanup when closing
            });

            this.activeDialog.render(true);
        }

        static generateDialogContent(abilities: Record<string, number>, abilityLabels: Record<string, string>, currentPoints: number): string {
            let content = `<style>
                .point-buy-container { text-align: center; font-size: 1.1em; }
                .ability-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
                .ability-name { width: 100px; text-align: left; }
                .point-value { width: 40px; text-align: center; font-weight: bold; }
                .btn-adjust { cursor: pointer; border: none; background: #444; color: white; font-size: 1.2em; width: 30px; height: 30px; border-radius: 5px; }
                .btn-adjust:hover { background: #666; }
                .remaining-points { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
            </style>
            <div class="point-buy-container">
                <p class="remaining-points">Remaining Points: <span id="remaining-points">${currentPoints}</span></p>
            `;

            for (let [key, name] of Object.entries(abilityLabels)) {
                content += `
                    <div class="ability-row">
                        <span class="ability-name">${name}</span>
                        <button class="btn-adjust" data-action="decrease" data-key="${key}">-</button>
                        <span class="point-value" id="ability-${key}">8</span>
                        <button class="btn-adjust" data-action="increase" data-key="${key}">+</button>
                    </div>
                `;
            }

            content += `</div>`;

            return content;
        }

        static setupListeners(html: JQuery<HTMLElement>, abilities: Record<string, number>): void {
            let remainingPoints = 27;
            let costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

            html.find(".btn-adjust").on("click", function () {
                let button = $(this);
                let key = button.data("key");
                let action = button.data("action");
                let valueElement = html.find(`#ability-${key}`);
                let currentValue = parseInt(valueElement.text());

                if (action === "increase" && currentValue < 15) {
                    if (remainingPoints - (costs[currentValue + 1] - costs[currentValue]) >= 0) {
                        remainingPoints -= (costs[currentValue + 1] - costs[currentValue]);
                        valueElement.text(currentValue + 1);
                    }
                } else if (action === "decrease" && currentValue > 8) {
                    remainingPoints += (costs[currentValue] - costs[currentValue - 1]);
                    valueElement.text(currentValue - 1);
                }

                html.find("#remaining-points").text(remainingPoints);
            });
        }

        static calculatePoints(abilities: Record<string, number>): number {
            let total = 27;
            let costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
            for (let value of Object.values(abilities)) {
                total -= costs[value] || 0;
            }
            return total;
        }

        static applyChanges(actor: Actor, html: JQuery<HTMLElement>): void {
            let updates: Record<string, number> = {};
            let remainingPoints = 27;
            let costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

            html.find(".ability-row").each((_index, element) => {
                let key = $(element).find(".btn-adjust").data("key");
                let newValue = parseInt($(element).find(".point-value").text());

                if (isNaN(newValue) || newValue < 8 || newValue > 15) return;

                remainingPoints -= costs[newValue] || 0;
                updates[`system.abilities.${key}.value`] = newValue;
            });

            if (remainingPoints < 0) {
                ui.notifications.error("Invalid point allocation. Please stay within the 27 points.");
                return;
            }

            actor.update(updates);
            ui.notifications.info("Abilities updated successfully.");
            this.activeDialog = null; // ✅ Close reference after applying changes
        }
    }
}
