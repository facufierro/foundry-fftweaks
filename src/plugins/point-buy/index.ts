declare const game: any;
declare const fromUuidSync: any;

export class PointBuy {
    private static activeDialog: Dialog | null = null;

    static initialize(): void {
        console.log("FFTweaks | PointBuy | initialize");

        // --- Primary: MutationObserver to detect Tidy 5e character sheets in the DOM ---
        const observer = new MutationObserver(() => {
            document.querySelectorAll<HTMLElement>('form.tidy5e-sheet.character').forEach((sheet) => {
                PointBuy.tryInject(sheet);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Also check any sheets already open right now
        document.querySelectorAll<HTMLElement>('form.tidy5e-sheet.character').forEach((sheet) => {
            PointBuy.tryInject(sheet);
        });

        // --- Backup: Tidy 5e custom hook (if it fires) ---
        Hooks.on("tidy5e-sheet.renderActorSheet" as any, (app: any, element: any, _data: any) => {
            console.log("FFTweaks | PointBuy | tidy5e-sheet.renderActorSheet fired");
            const el = (element instanceof HTMLElement) ? element : element?.[0];
            if (el) PointBuy.tryInject(el);
        });
    }

    /** Find the actor for a sheet and inject the button if conditions are met */
    private static tryInject(sheet: HTMLElement): void {
        // Don't duplicate
        if (sheet.querySelector("#fft-pointbuy-button")) return;

        const container = sheet.querySelector<HTMLElement>('[data-tidy-sheet-part="sheet-header-actions-container"]');
        if (!container) return;

        // Get the actor from the sheet's uuid attribute
        const uuid = sheet.getAttribute("data-document-uuid");
        if (!uuid) return;

        let actor: any;
        try { actor = fromUuidSync(uuid); } catch { return; }
        if (!actor || actor.type !== "character") return;

        // Don't show if the character already has a background
        if (actor.items.some((i: any) => i.type === "background")) return;

        // Create our button, matching the existing Short/Long Rest button style
        const btn = document.createElement("button");
        btn.id = "fft-pointbuy-button";
        btn.type = "button";
        btn.className = "button button-icon-only button-gold";
        btn.setAttribute("data-tooltip", "Point Buy");
        btn.setAttribute("aria-label", "Point Buy");
        btn.innerHTML = `<i class="fas fa-chart-bar"></i>`;
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            PointBuy.renderDialog(actor);
        });

        container.appendChild(btn);
        console.log("FFTweaks | PointBuy | Button injected!");
    }

    // ----------------------------------------------------------------
    // Dialog
    // ----------------------------------------------------------------

    private static renderDialog(actor: any): void {
        if (this.activeDialog) {
            if (this.activeDialog.rendered) this.activeDialog.bringToTop();
            return;
        }

        const abilities: Record<string, number> = {
            str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
        };
        const labels: Record<string, string> = {
            str: "Strength", dex: "Dexterity", con: "Constitution",
            int: "Intelligence", wis: "Wisdom", cha: "Charisma"
        };
        const costs: Record<number, number> = {
            8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
        };
        const totalBudget = 27;
        const calcRemaining = (abs: Record<string, number>) =>
            totalBudget - Object.values(abs).reduce((sum, v) => sum + (costs[v] ?? 0), 0);

        this.activeDialog = new Dialog({
            title: "Point Buy System",
            content: this.buildContent(abilities, labels, calcRemaining(abilities)),
            render: (html: JQuery<HTMLElement>) => {
                let remaining = totalBudget;
                html.find(".btn-adjust").on("click", function (event: JQuery.ClickEvent) {
                    const $btn = $(this);
                    const key = $btn.data("key") as string;
                    const action = $btn.data("action") as string;
                    const valueEl = html.find(`#ability-${key}`);
                    const current = parseInt(valueEl.text());
                    let next = current;

                    if (event.shiftKey) {
                        next = action === "increase" ? 15 : 8;
                    } else if (action === "increase" && current < 15) {
                        next = current + 1;
                    } else if (action === "decrease" && current > 8) {
                        next = current - 1;
                    }

                    const diff = (costs[next] ?? 0) - (costs[current] ?? 0);
                    if (remaining - diff >= 0) {
                        valueEl.text(next);
                        remaining -= diff;
                    }
                    html.find("#remaining-points").text(remaining);
                });
                html.closest(".app").addClass("no-resize");
                html.closest(".window-app").find(".window-resizable-handle").remove();
            },
            buttons: {
                confirm: {
                    label: "Apply",
                    callback: (html: any) => {
                        this.applyChanges(actor, $(html), costs, totalBudget);
                        this.activeDialog = null;
                    }
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

    private static buildContent(
        abilities: Record<string, number>,
        labels: Record<string, string>,
        remainingPoints: number
    ): string {
        let rows = "";
        for (const [key, value] of Object.entries(abilities)) {
            rows += `
                <div class="ability-row">
                    <span class="ability-name">${labels[key]}</span>
                    <button type="button" class="btn-adjust" data-action="decrease" data-key="${key}">−</button>
                    <span class="point-value" id="ability-${key}">${value}</span>
                    <button type="button" class="btn-adjust" data-action="increase" data-key="${key}">+</button>
                </div>`;
        }

        return `
            <style>
                .point-buy-container { text-align: center; font-size: 1.1em; }
                .ability-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
                .ability-name { width: 100px; text-align: left; }
                .point-value { width: 40px; text-align: center; font-weight: bold; }
                .btn-adjust { cursor: pointer; border: none; background: #444; color: white; font-size: 1.2em; width: 30px; height: 30px; border-radius: 5px; }
                .btn-adjust:hover { background: #666; }
                .remaining-points { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
            </style>
            <div class="point-buy-container">
                <p class="remaining-points">Remaining Points: <span id="remaining-points">${remainingPoints}</span></p>
                ${rows}
            </div>`;
    }

    private static applyChanges(
        actor: any,
        html: JQuery<HTMLElement>,
        costs: Record<number, number>,
        totalBudget: number
    ): void {
        const updates: Record<string, number> = {};
        let remaining = totalBudget;

        html.find(".ability-row").each((_i, el) => {
            const key = $(el).find(".btn-adjust").data("key") as string;
            const val = parseInt($(el).find(".point-value").text());
            if (isNaN(val) || val < 8 || val > 15) return;
            remaining -= costs[val] ?? 0;
            updates[`system.abilities.${key}.value`] = val;
        });

        if (remaining < 0) {
            ui.notifications.error("Invalid point allocation. Please stay within the 27 points.");
            return;
        }

        actor.update(updates);
    }
}
