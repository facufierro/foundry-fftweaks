namespace FFT {
    let activeTargetPicker: TargetPicker | null = null;

    export interface TargetPickerOptions {
        clearExistingTargets?: boolean;
        showRangeDisplay?: boolean;
        allowManualTargetAdjustment?: boolean;
        followCursor?: boolean;
    }

    export interface TargetPickerConfig {
        token: any;
        targets: number;
        ranges?: { normal?: number; long?: number };
        options?: TargetPickerOptions;
    }

    export class TargetPicker {
        private ranges: any;
        private token: any;
        private resolve: ((value: Record<string, number>|false) => void) | null = null;
        private _maxTargets: number;
        private options: TargetPickerOptions;
        private element: HTMLElement | null = null;
        private moveListener: ((event: MouseEvent) => void) | null = null;
        private keyupListener: ((event: KeyboardEvent) => void) | null = null;
        private _selected: Record<string, number> = {};
        public promise: Promise<Record<string, number>|false>;
        private onCanvasClickBound: ((event: MouseEvent) => void) | null = null;

        constructor({ token, targets, ranges = {}, options = {} }: TargetPickerConfig) {
            if (activeTargetPicker) activeTargetPicker.end(false);
            activeTargetPicker = this;
            this.ranges = ranges;
            this.token = token;
            this._maxTargets = targets;
            this.options = {
                clearExistingTargets: true,
                showRangeDisplay: true,
                allowManualTargetAdjustment: true,
                followCursor: true,
                ...options
            };
            this.promise = new Promise((resolve) => {
                this.resolve = resolve;
            });
            this.setupEventListeners();
            this.init();
        }

        private setupEventListeners() {
            this.moveListener = (event: MouseEvent) => {
                if (this.options.followCursor) this.update(event);
            };
            document.addEventListener("mousemove", this.moveListener);
            document.addEventListener("keyup", this.keyupListener = (event: KeyboardEvent) => {
                if (!this.options.allowManualTargetAdjustment) return;
                if (event.key === "+" || event.key === "=") this._maxTargets++;
                if ((event.key === "-" || event.key === "_") && this._maxTargets > 1) this._maxTargets--;
                this.update();
            });
            canvas.app.view.addEventListener("mousedown", this.onCanvasClickBound = this.onCanvasClick.bind(this));
        }

        private onCanvasClick(event: MouseEvent) {
            if (event.button !== 0 && event.button !== 2) return;
            
            // Get click position relative to the canvas element
            const rect = canvas.app.view.getBoundingClientRect() as DOMRect;
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            // Convert to world coordinates
            const t = canvas.stage.worldTransform;
            const worldX = (clickX - t.tx) / t.a;
            const worldY = (clickY - t.ty) / t.d;

            // Find all tokens under cursor
            const candidates: any[] = [];
            const tokens = canvas.tokens.placeables;

            for (const token of tokens) {
                if (!token.visible) continue;
                // Use containsPoint which handles the transform checks reliably
                const b = token.bounds;
                if (worldX >= b.x && worldX < b.x + b.width && worldY >= b.y && worldY < b.y + b.height) {
                    candidates.push(token);
                }
            }

            // If no token hit
            if (candidates.length === 0) {
                if (event.button === 2) this.end(false);
                return;
            }

            // Sort candidates to find the top-most one (visually)
            // Priority: Elevation > Y position
            candidates.sort((a, b) => {
                const elevA = a.document?.elevation ?? 0;
                const elevB = b.document?.elevation ?? 0;
                if (elevA !== elevB) return elevB - elevA;
                return b.y - a.y;
            });

            const token = candidates[0];
            const id = token.id;

            if (event.button === 2) {
                if (this._selected[id]) {
                    this._selected[id]--;
                    if (this._selected[id] <= 0) delete this._selected[id];
                }
            } else {
                const total = this.totalSelected();
                if (total < this._maxTargets) {
                    this._selected[id] = (this._selected[id] || 0) + 1;
                }
            }
            this.update();
            if (this.totalSelected() >= this._maxTargets) this.end(true);
        }

        private totalSelected(): number {
            return Object.values(this._selected).reduce((a, b) => a + b, 0);
        }

        private init() {
            canvas.tokens?.placeables.forEach(t => t.setTarget(false, { releaseOthers: false }));

            const element = document.createElement("div");
            element.classList.add("target-picker-display");
            element.style.cssText = `
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
            document.body.appendChild(element);
            this.element = element;

            if (!this._maxTargets || this.totalSelected() >= this._maxTargets) {
                return this.end(true);
            }

            const tokenSizeOffset = Math.max(
                this.token.document.width,
                this.token.document.height
            ) * 0.5 * (canvas.scene?.dimensions.distance || 5);

            FFT.RangeDisplay.showRangeRings(this.ranges.normal, this.ranges.long, this.token, tokenSizeOffset);
            FFT.RangeDisplay.showRangeFinder(this.ranges.normal, this.token);
            this.update();
        }

        private update(event?: MouseEvent) {
            if (!this.element) return;

            if (event && this.options.followCursor) {
                this.element.style.left = event.clientX + 20 + "px";
                this.element.style.top = event.clientY + "px";
            }

            const tokens = Object.entries(this._selected).map(([id, count]) => {
                const t = canvas.tokens.get(id);
                return t ? `${t.name} x${count}` : `Unknown x${count}`;
            });
            this.element.innerText = `${this.totalSelected()}/${this._maxTargets} Targets\n` + tokens.join("\n");
        }

        private end(success: boolean) {
            FFT.RangeDisplay.clearRanges(true);
            FFT.RangeDisplay.clearRangeFinders();

            (document.querySelector(".control.tool") as HTMLElement)?.click();
            (document.querySelector('.control.tool[data-tool="select"]') as HTMLElement)?.click();

            if (this.token) {
                canvas.tokens?.placeables.forEach(t => t.release());
                this.token.control({ releaseOthers: false });
            }

            activeTargetPicker = null;
            if (this.resolve) this.resolve(success ? this._selected : false);
            this.element?.remove();
            document.removeEventListener("mousemove", this.moveListener!);
            document.removeEventListener("keyup", this.keyupListener!);
            if (this.onCanvasClickBound) {
                canvas.app.view.removeEventListener("mousedown", this.onCanvasClickBound);
                this.onCanvasClickBound = null;
            }
        }

        static async pickTargets(
            token: any,
            targetCount: number,
            ranges: any = {},
            options: TargetPickerOptions = {}
        ): Promise<Record<string, number>|false> {
            const picker = new TargetPicker({ token, targets: targetCount, ranges, options });
            return await picker.promise;
        }

        static clearAllTargets(): void {
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));
        }
    }
}
