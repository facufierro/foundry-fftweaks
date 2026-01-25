export class TargetPicker {
    static initialize(): void {
        Hooks.on("dnd5e.preUseActivity" as any, this.onPreUseActivity.bind(this));
    }

    private static isTargetPickerActivity = false;
    private static suppressInterceptor = false;

    private static onPreUseActivity(activity: any, config: any, options: any): boolean {
        if (this.suppressInterceptor) return true;
        if (this.isTargetPickerActivity) return true;
        if (!this.shouldInterceptActivity(activity)) return true;

        this.isTargetPickerActivity = true;
        this.startTargetPicker(activity);
        return false;
    }

    private static shouldInterceptActivity(activity: any): boolean {
        return activity.type === "attack" || (activity.target?.affects?.count && activity.target.affects.count >= 1);
    }

    private static async startTargetPicker(activity: any): Promise<void> {
        try {
            const token = activity.actor?.token?.object || canvas.tokens?.controlled?.[0];
            const targetCount = activity.type === "attack" ? 1 : (activity.target?.affects?.count || 1);
            const range = activity.range?.value || 30;
            const selection = await PickerUI.pickTargets(token, targetCount, { normal: range });

            if (selection && typeof selection === "object") {
                this.suppressInterceptor = true;
                const targets: any[] = [];
                for (const [tokenId, count] of Object.entries(selection)) {
                    const t = canvas.tokens.get(tokenId);
                    if (t) for (let i = 0; i < count; i++) targets.push(t);
                }

                let firstCastSucceeded = false;
                for (let i = 0; i < targets.length; i++) {
                    const t = targets[i];
                    (game.user as any)?.targets.forEach((tok: any) => tok.setTarget(false, { releaseOthers: true }));
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await t.setTarget(true, { releaseOthers: true });
                    await new Promise(resolve => setTimeout(resolve, 200));
                    Hooks.call("targetToken" as any, t, true);

                    if (i === 0) {
                        const result = await activity.use();
                        if (this.isActivitySuccessful(result)) {
                            firstCastSucceeded = true;
                        } else break;
                    } else {
                        if (!firstCastSucceeded) break;
                        let usedForward = false;
                        const item = activity.item;
                        if (item?.system?.activities) {
                            const forward = Array.from(item.system.activities.values()).find((a: any) => a.type === "forward");
                            if (forward && typeof (forward as any).use === "function") {
                                await (forward as any).use();
                                usedForward = true;
                            }
                        }
                        if (!usedForward) await activity.use();
                    }
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
                (game.user as any)?.targets.forEach((tok: any) => tok.setTarget(false, { releaseOthers: true }));
                this.suppressInterceptor = false;
            }
            this.isTargetPickerActivity = false;
        } catch (error) {
            console.error("Error in target picker:", error);
            this.suppressInterceptor = false;
            this.isTargetPickerActivity = false;
        }
    }

    private static isActivitySuccessful(result: any): boolean {
        if (!result) return false;
        if (result.message || result.messages || result.actorUpdates || result.itemUpdates) return true;
        if (result.rolls || result.roll) return true;
        if (result === false || (typeof result === 'object' && Object.keys(result).length === 0)) return false;
        if (typeof result === 'object' && result !== null) return true;
        return false;
    }
}

class PickerUI {
    private static activePicker: PickerUI | null = null;
    private ranges: any;
    private token: any;
    private resolve: ((value: Record<string, number> | false) => void) | null = null;
    private maxTargets: number;
    private element: HTMLElement | null = null;
    private moveListener: ((event: MouseEvent) => void) | null = null;
    private keyupListener: ((event: KeyboardEvent) => void) | null = null;
    private selected: Record<string, number> = {};
    private onCanvasClickBound: ((event: MouseEvent) => void) | null = null;

    private constructor(token: any, targets: number, ranges: any) {
        if (PickerUI.activePicker) PickerUI.activePicker.end(false);
        PickerUI.activePicker = this;
        this.ranges = ranges;
        this.token = token;
        this.maxTargets = targets;
        this.setupEventListeners();
        this.init();
    }

    static async pickTargets(token: any, targetCount: number, ranges: any = {}): Promise<Record<string, number> | false> {
        return new Promise((resolve) => {
            const picker = new PickerUI(token, targetCount, ranges);
            picker.resolve = resolve;
        });
    }

    private setupEventListeners(): void {
        this.moveListener = (event: MouseEvent) => this.update(event);
        document.addEventListener("mousemove", this.moveListener);
        this.keyupListener = (event: KeyboardEvent) => {
            if (event.key === "+" || event.key === "=") this.maxTargets++;
            if ((event.key === "-" || event.key === "_") && this.maxTargets > 1) this.maxTargets--;
            this.update();
        };
        document.addEventListener("keyup", this.keyupListener);
        this.onCanvasClickBound = this.onCanvasClick.bind(this);
        canvas.app.view.addEventListener("mousedown", this.onCanvasClickBound);
    }

    private onCanvasClick(event: MouseEvent): void {
        if (event.button !== 0 && event.button !== 2) return;

        const rect = canvas.app.view.getBoundingClientRect() as DOMRect;
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const t = canvas.stage.worldTransform;
        const worldX = (clickX - t.tx) / t.a;
        const worldY = (clickY - t.ty) / t.d;

        const candidates: any[] = [];
        for (const token of canvas.tokens.placeables) {
            if (!token.visible) continue;
            const b = token.bounds;
            if (worldX >= b.x && worldX < b.x + b.width && worldY >= b.y && worldY < b.y + b.height) {
                candidates.push(token);
            }
        }

        if (candidates.length === 0) {
            if (event.button === 2) this.end(false);
            return;
        }

        candidates.sort((a, b) => {
            const elevA = a.document?.elevation ?? 0;
            const elevB = b.document?.elevation ?? 0;
            if (elevA !== elevB) return elevB - elevA;
            return b.y - a.y;
        });

        const token = candidates[0];
        const id = token.id;

        if (event.button === 2) {
            if (this.selected[id]) {
                this.selected[id]--;
                if (this.selected[id] <= 0) delete this.selected[id];
            }
        } else {
            if (this.totalSelected() < this.maxTargets) {
                this.selected[id] = (this.selected[id] || 0) + 1;
            }
        }
        this.update();
        if (this.totalSelected() >= this.maxTargets) this.end(true);
    }

    private totalSelected(): number {
        return Object.values(this.selected).reduce((a, b) => a + b, 0);
    }

    private init(): void {
        canvas.tokens?.placeables.forEach(t => t.setTarget(false, { releaseOthers: false }));

        this.element = document.createElement("div");
        this.element.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Signika', sans-serif;
            font-size: 14px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            border: 1px solid #555;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(this.element);

        if (!this.maxTargets || this.totalSelected() >= this.maxTargets) {
            this.end(true);
            return;
        }

        const tokenSizeOffset = Math.max(this.token.document.width, this.token.document.height) * 0.5 * (canvas.scene?.dimensions.distance || 5);
        RangeDisplay.showRangeRings(this.ranges.normal, this.ranges.long, this.token, tokenSizeOffset);
        RangeDisplay.showRangeFinder(this.ranges.normal, this.token);
        this.update();
    }

    private update(event?: MouseEvent): void {
        if (!this.element) return;

        if (event) {
            this.element.style.left = event.clientX + 20 + "px";
            this.element.style.top = event.clientY + "px";
        }

        const tokens = Object.entries(this.selected).map(([id, count]) => {
            const t = canvas.tokens.get(id);
            return t ? `${t.name} x${count}` : `Unknown x${count}`;
        });
        this.element.innerText = `${this.totalSelected()}/${this.maxTargets} Targets\n` + tokens.join("\n");
    }

    private end(success: boolean): void {
        RangeDisplay.clearRanges(true);
        RangeDisplay.clearRangeFinders();
        (document.querySelector(".control.tool") as HTMLElement)?.click();
        (document.querySelector('.control.tool[data-tool="select"]') as HTMLElement)?.click();

        if (this.token) {
            canvas.tokens?.placeables.forEach(t => t.release());
            this.token.control({ releaseOthers: false });
        }

        PickerUI.activePicker = null;
        if (this.resolve) this.resolve(success ? this.selected : false);
        this.element?.remove();
        if (this.moveListener) document.removeEventListener("mousemove", this.moveListener);
        if (this.keyupListener) document.removeEventListener("keyup", this.keyupListener);
        if (this.onCanvasClickBound) canvas.app.view.removeEventListener("mousedown", this.onCanvasClickBound);
    }
}

class RangeDisplay {
    private static isTargetPicker = false;
    private static rangeRings = { normal: null as any, long: null as any };

    static clearRanges(force = false): void {
        if (!(game as any).Levels3DPreview?._active) return;
        if (this.isTargetPicker && !force) return;

        if (this.rangeRings.normal) {
            this.rangeRings.normal.remove();
            this.rangeRings.normal = null;
        }
        if (this.rangeRings.long) {
            this.rangeRings.long.remove();
            this.rangeRings.long = null;
        }
    }

    static showRangeRings(normal: number, long: number, object: any, tokenSizeOffset = 0): void {
        if (!(game as any).Levels3DPreview?._active) return;
        this.clearRanges(true);
        this.isTargetPicker = true;

        const RangeRingEffect = (game as any).Levels3DPreview.CONFIG.entityClass.RangeRingEffect;
        if (normal) this.rangeRings.normal = new RangeRingEffect(object, normal + tokenSizeOffset);
        if (long) this.rangeRings.long = new RangeRingEffect(object, long + tokenSizeOffset, "#ff0000");
    }

    static async showRangeFinder(range: number, object: any): Promise<void> {
        if (!(game as any).Levels3DPreview?._active || !range) return;

        const levels3d = (game as any).Levels3DPreview;
        const RangeFinder = levels3d.CONFIG.entityClass.RangeFinder;
        levels3d.rangeFinders.forEach((rf: any) => rf.destroy());

        const visTokens = canvas.tokens?.placeables.filter(t => t.visible) || [];
        for (let t of visTokens) {
            const dist = levels3d.helpers.ruler3d.measureMinTokenDistance(levels3d.tokens[object.id], levels3d.tokens[t.id]);
            const distDiff = range - dist;

            if (distDiff >= 0) {
                new RangeFinder(t, { sources: [object], text: "" });
            } else {
                new RangeFinder(t, {
                    sources: [object],
                    text: `-${Math.abs(Number(distDiff.toFixed(2)))}${canvas.scene?.grid.units || ""}`,
                    style: { color: 'rgb(210 119 119);' }
                });
            }
        }
    }

    static clearRangeFinders(): void {
        if (!(game as any).Levels3DPreview?._active) return;
        (game as any).Levels3DPreview.rangeFinders.forEach((rf: any) => rf.destroy());
        this.isTargetPicker = false;
    }
}