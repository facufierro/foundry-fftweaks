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
        private resolve: ((value: boolean) => void) | null = null;
        private _targetCount: number;
        private _maxTargets: number;
        private options: TargetPickerOptions;
        private element: HTMLElement | null = null;
        private targetHook: number | null = null;
        private moveListener: ((event: MouseEvent) => void) | null = null;
        private clickListener: ((event: MouseEvent) => void) | null = null;
        private keyupListener: ((event: KeyboardEvent) => void) | null = null;
        public promise: Promise<boolean>;

        constructor({ token, targets, ranges = {}, options = {} }: TargetPickerConfig) {
            // End any existing target picker
            if (activeTargetPicker) activeTargetPicker.end(false);
            activeTargetPicker = this;

            this.ranges = ranges;
            this.token = token;
            this._targetCount = game.user?.targets.size || 0;
            this._maxTargets = targets;
            this.options = {
                clearExistingTargets: true,
                showRangeDisplay: true,
                allowManualTargetAdjustment: true,
                followCursor: true,
                ...options
            };

            // Activate target tool
            const targetTool = document.querySelector('.control.tool[data-tool="target"]') as HTMLElement;
            targetTool?.click();

            // Create promise for async handling
            this.promise = new Promise((resolve) => {
                this.resolve = resolve;
            });

            // Hook into target events
            this.targetHook = Hooks.on("targetToken", () => {
                this.checkComplete();
            });

            // Set up event listeners
            this.setupEventListeners();
            this.init();
        }

        private setupEventListeners() {
            this.moveListener = (event: MouseEvent) => {
                if (this.options.followCursor) {
                    this.update(event);
                }
            };

            this.clickListener = (event: MouseEvent) => {
                if (event.which === 3) { // Right click
                    this.end(false);
                }
            };

            this.keyupListener = (event: KeyboardEvent) => {
                if (!this.options.allowManualTargetAdjustment) return;

                if (event.key === "+" || event.key === "=") {
                    this.maxTargets++;
                }
                if (event.key === "-" || event.key === "_") {
                    if (this.maxTargets > 1) this.maxTargets--;
                }
            };

            document.addEventListener("mousemove", this.moveListener);
            document.addEventListener("mouseup", this.clickListener);
            document.addEventListener("keyup", this.keyupListener);
        }

        private checkComplete() {
            this.targetCount = game.user?.targets.size || 0;
            if (this.targetCount >= this.maxTargets) {
                this.end(true);
            }
        }

        set targetCount(count: number) {
            this._targetCount = count;
            this.update();
        }

        get targetCount(): number {
            return this._targetCount;
        }

        set maxTargets(count: number) {
            this._maxTargets = count;
            this.update();
            this.checkComplete();
        }

        get maxTargets(): number {
            return this._maxTargets;
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
            if (!this.maxTargets || this.targetCount >= this.maxTargets) {
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
                const clientX = event.clientX;
                const clientY = event.clientY;
                this.element.style.left = clientX + 20 + "px";
                this.element.style.top = clientY + "px";
            }

            this.element.innerText = `${this.targetCount}/${this.maxTargets} Targets`;
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
            this.resolve?.(success);
            this.element?.remove();

            // Remove event listeners
            if (this.targetHook !== null) {
                Hooks.off("targetToken", this.targetHook);
            }
            if (this.moveListener) {
                document.removeEventListener("mousemove", this.moveListener);
            }
            if (this.clickListener) {
                document.removeEventListener("mouseup", this.clickListener);
            }
            if (this.keyupListener) {
                document.removeEventListener("keyup", this.keyupListener);
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
        ): Promise<boolean> {
            const picker = new TargetPicker({
                token,
                targets: targetCount,
                ranges,
                options
            });

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
