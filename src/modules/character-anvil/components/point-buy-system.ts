namespace FFT {
    export class PointBuySystem {
        private static activeDialog: Dialog | null = null; // Prevent multiple windows

        static initialize(actor: Actor, html: JQuery<HTMLElement>) {
            const buttonHolder = html.find('.sheet-header-buttons');
            if (!buttonHolder.length || html.find("#fft-custom-button").length) return;

            const button = new FFT.CustomButton({
                id: "fft-pointbuy-button",
                tooltip: "Point Buy System",
                iconClass: "fas fa-chart-bar",
                onClick: () => {
                    this.showDialog(actor);
                }
            });

            button.appendTo(buttonHolder);
        }


        static showDialog(actor: Actor): void {
            if (this.activeDialog) {
                if (this.activeDialog.rendered) {
                    this.activeDialog.bringToTop();
                }
                return;
            }

            let abilities: Record<string, number> = {
                str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8
            };
            let abilityLabels: Record<string, string> = {
                str: "Strength",
                dex: "Dexterity",
                con: "Constitution",
                int: "Intelligence",
                wis: "Wisdom",
                cha: "Charisma"
            };

            let currentPoints = this.calculatePoints(abilities);
            let content = this.generateDialogContent(abilities, abilityLabels, currentPoints);

            this.activeDialog = new Dialog({
                title: "Point Buy System",
                content: content,
                render: (html: JQuery<HTMLElement>) => {
                    this.setupListeners(html, abilities);
                    html.closest(".app").addClass("no-resize"); // ✅ Prevent resizing via CSS
                    html.closest(".window-app").find(".window-resizable-handle").remove(); // ✅ Remove resize handle
                },
                buttons: {
                    confirm: {
                        label: "Apply",
                        callback: (html) => this.applyChanges(actor, $(html))
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => { this.activeDialog = null; }
                    }
                },
                close: () => { this.activeDialog = null; }
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

            for (let key of Object.keys(abilities)) {
                let name = abilityLabels[key];
                content += `
                    <div class="ability-row">
                        <span class="ability-name">${name}</span>
                        <button class="btn-adjust" data-action="decrease" data-key="${key}">-</button>
                        <span class="point-value" id="ability-${key}">${abilities[key]}</span>
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

            html.find(".btn-adjust").on("click", function (event) {
                let button = $(this);
                let key = button.data("key");
                let action = button.data("action");
                let valueElement = html.find(`#ability-${key}`);
                let currentValue = parseInt(valueElement.text());

                let newValue = currentValue;

                if (event.shiftKey) {
                    newValue = (action === "increase") ? 15 : 8;
                } else {
                    if (action === "increase" && currentValue < 15) {
                        newValue++;
                    } else if (action === "decrease" && currentValue > 8) {
                        newValue--;
                    }
                }

                let oldCost = costs[currentValue] || 0;
                let newCost = costs[newValue] || 0;
                let pointChange = newCost - oldCost;

                if (remainingPoints - pointChange >= 0) {
                    valueElement.text(newValue);
                    remainingPoints -= pointChange;
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
            this.activeDialog = null;
        }
    }
}
