namespace FFT {
    let activeTargetPicker: TargetPicker | null = null;

    export class TargetPicker {
        private ranges: any;
        private token: any;
        private resolve: ((value: boolean) => void) | null = null;
        private reject: ((reason?: any) => void) | null = null;
        private _targetCount: number;
        private _maxTargets: number;
        private options: any;
        private element: HTMLElement | null = null;
        private targetHook: number | null = null;
        private moveListener: ((event: MouseEvent) => void) | null = null;
        private clickListener: ((event: MouseEvent) => void) | null = null;
        private keyupListener: ((event: KeyboardEvent) => void) | null = null;
        public promise: Promise<boolean>;

        constructor({ token, targets, ranges = {}, options = {} }: {
            token: any;
            targets: number;
            ranges?: any;
            options?: any;
        }) {
            // Show guide if this is the first time
            if (options.showGuide !== false) {
                this.checkShowTargetPickerGuide();
            }
            
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
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });

            // Hook into target events
            this.targetHook = Hooks.on("targetToken", (user: any, token: any, targeted: boolean) => {
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
                
                // Check for + and - keys to adjust target count
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
            // Clear existing targets if option is set
            if (this.options.clearExistingTargets) {
                game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));
            }

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
            if (this.options.showRangeDisplay && (this.ranges.normal || this.ranges.long)) {
                const tokenSizeOffset = Math.max(
                    this.token.document.width, 
                    this.token.document.height
                ) * 0.5 * (canvas.scene?.dimensions.distance || 5);
                
                FFT.RangeDisplay.showRangeRings(this.ranges.normal, this.ranges.long, this.token, tokenSizeOffset);
                FFT.RangeDisplay.showRangeFinder(this.ranges.normal, this.token);
            }

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
            if (this.options.showRangeDisplay) {
                FFT.RangeDisplay.clearRanges(true);
                FFT.RangeDisplay.clearRangeFinders();
            }

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

        private checkShowTargetPickerGuide() {
            try {
                if (!(game.settings as any).get("fftweaks", "targetPickerGuideShown")) {
                    this.showTargetPickerGuide().then(() => {
                        (game.settings as any).set("fftweaks", "targetPickerGuideShown", true);
                    });
                }
            } catch (e) {
                // Setting doesn't exist, skip guide
            }
        }

        private async showTargetPickerGuide() {
            const instructions = [
                "The number of Selected/Required targets will follow your cursor",
                "<span style='font-weight: bold;'>Left click</span> or press <span style='font-weight: bold;'>T</span> to target a token",
                "<span style='font-weight: bold;'>Right click</span> to cancel target selection",
                "Press the <span style='font-weight: bold;'>+</span> or <span style='font-weight: bold;'>-</span> key to increase/decrease the number of required targets manually"
            ];

            let list = "";
            instructions.forEach(instruction => {
                list += `<li style="margin-bottom: 8px; font-weight: 900;">${instruction}</li>`;
            });

            return await Dialog.prompt({
                title: "Target Picker Tutorial",
                content: `<ul style="list-style: none; padding: 0; margin: 0;">${list}</ul>`,
                callback: () => { return false; },
            });
        }

        /**
         * Utility function for easy usage
         */
        static async pickTargets(token: any, targetCount: number, ranges: any = {}, options: any = {}): Promise<boolean> {
            const picker = new TargetPicker({
                token,
                targets: targetCount,
                ranges,
                options
            });
            
            return await picker.promise;
        }
    }
}
