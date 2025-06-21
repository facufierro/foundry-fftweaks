namespace FFT {
    /**
     * Core Target Picker functionality
     * A simple, focused target selection system for Foundry VTT
     */

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
            // Token click handler (listen on canvas.app.view)
            canvas.app.view.addEventListener("mousedown", this.onCanvasClickBound = this.onCanvasClick.bind(this));
        }

        private onCanvasClickBound: ((event: MouseEvent) => void) | null = null;

        private onCanvasClick(event: MouseEvent) {
            // Only respond to left/right click
            if (event.button !== 0 && event.button !== 2) return;
            // Get mouse position relative to canvas
            const pos = event;
            const rect = canvas.app.view.getBoundingClientRect() as DOMRect;
            // Find token under mouse
            const tokens = canvas.tokens.placeables;
            for (const token of tokens) {
                const bounds = token.getBounds();
                if (bounds.contains(pos.clientX - rect.left, pos.clientY - rect.top)) {
                    const id = token.id;
                    if (event.button === 2) { // Right click: decrement
                        if (this._selected[id]) {
                            this._selected[id]--;
                            if (this._selected[id] <= 0) delete this._selected[id];
                        }
                    } else { // Left click: increment
                        const total = this.totalSelected();
                        if (total < this._maxTargets) {
                            this._selected[id] = (this._selected[id] || 0) + 1;
                        }
                    }
                    this.update();
                    if (this.totalSelected() >= this._maxTargets) this.end(true);
                    break;
                }
            }
        }

        private totalSelected(): number {
            return Object.values(this._selected).reduce((a, b) => a + b, 0);
        }

        private init() {
            // Clear existing targets
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            // Create UI element
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

            // End immediately if no targets needed or already at target count
            if (!this._maxTargets || this.totalSelected() >= this._maxTargets) {
                return this.end(true);
            }

            // Show range display if enabled and ranges provided
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

            // Show per-token counts
            const tokens = Object.entries(this._selected).map(([id, count]) => {
                const t = canvas.tokens.get(id);
                return t ? `${t.name} x${count}` : `Unknown x${count}`;
            });
            this.element.innerText = `${this.totalSelected()}/${this._maxTargets} Targets\n` + tokens.join("\n");
        }

        private end(success: boolean) {
            // Clean up range display
            FFT.RangeDisplay.clearRanges(true);
            FFT.RangeDisplay.clearRangeFinders();

            // Revert to select tool
            (document.querySelector(".control.tool") as HTMLElement)?.click();
            (document.querySelector('.control.tool[data-tool="select"]') as HTMLElement)?.click();

            // Clean up
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

        /**
         * Static method for easy target picking
         */
        static async pickTargets(
            token: any,
            targetCount: number,
            ranges: any = {},
            options: TargetPickerOptions = {}
        ): Promise<Record<string, number>|false> {
            const picker = new TargetPicker({ token, targets: targetCount, ranges, options });
            return await picker.promise;
        }

        /**
         * Clear all currently selected targets
         */
        static clearAllTargets(): void {
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));
        }
    }
}
