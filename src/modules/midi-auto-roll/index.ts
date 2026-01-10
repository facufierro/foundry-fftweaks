namespace FFT {
    export class MidiAutoRollModule {
        private static observer: MutationObserver | null = null;
        private static isEnabled = true;

        /**
         * Initializes the auto-roll module that automatically clicks midi-qol roll buttons
         */
        static initialize(): void {
            console.log("FFTweaks | Initializing Midi Auto Roll module");
            
            // Hook into Foundry's render system to catch dialogs even earlier
            this.hookIntoFoundryRender();
            
            // Start observing for midi-qol dialogs with immediate response
            this.startFastObserver();
            
            // Also check immediately in case there are already dialogs open
            this.checkForRollButtons();
        }

        /**
         * Hooks into Foundry's application rendering to catch midi-qol dialogs immediately
         */
        private static hookIntoFoundryRender(): void {
            // Hook into all dialog rendering
            Hooks.on("renderDialog", (app: any, html: JQuery) => {
                if (!this.isEnabled) return;
                
                // Check if this looks like a midi-qol dialog
                const rollButton = html.find('button[data-action="roll"]');
                if (rollButton.length > 0) {
                    const span = rollButton.find('span');
                    const icon = rollButton.find('i.fa-dice-d20, i.fa-solid.fa-dice-d20');
                    
                    if (span.text().trim() === 'Roll' && icon.length > 0) {
                        console.log("FFTweaks | Caught midi-qol dialog on render, auto-clicking...");
                        
                        // Click immediately
                        rollButton[0].click();
                        console.log("FFTweaks | Auto-clicked roll button via render hook");
                        
                        // Try to close the dialog immediately
                        setTimeout(() => {
                            if (app.close) app.close();
                        }, 50);
                    }
                }
            });

            // Also hook into any application render as a fallback
            Hooks.on("renderApplication", (app: any, html: JQuery) => {
                if (!this.isEnabled) return;
                
                // Quick check for roll buttons in any application
                const rollButtons = html.find('button[data-action="roll"]');
                rollButtons.each((index, button) => {
                    const $button = $(button);
                    const span = $button.find('span');
                    const icon = $button.find('i.fa-dice-d20, i.fa-solid.fa-dice-d20');
                    
                    if (span.text().trim() === 'Roll' && icon.length > 0) {
                        console.log("FFTweaks | Found roll button in application render, auto-clicking...");
                        button.click();
                    }
                });
            });
        }

        /**
         * Starts the mutation observer with immediate response to catch dialogs as they're created
         */
        private static startFastObserver(): void {
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node as Element;
                                
                                // Check immediately without delay
                                this.checkElementForRollButtons(element);
                                
                                // Also use requestAnimationFrame for even faster response
                                requestAnimationFrame(() => {
                                    this.checkElementForRollButtons(element);
                                });
                            }
                        });
                    }
                });
            });

            // Start observing with immediate synchronous processing
            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        /**
         * Checks the entire document for roll buttons
         */
        private static checkForRollButtons(): void {
            this.checkElementForRollButtons(document.body);
        }

        /**
         * Checks a specific element and its children for roll buttons with immediate action
         */
        private static checkElementForRollButtons(element: Element): void {
            if (!this.isEnabled) return;

            // Look for the specific roll button
            const rollButtons = element.querySelectorAll('button[data-action="roll"]');
            
            Array.from(rollButtons).forEach(button => {
                // Additional check to make sure it's the midi-qol roll button
                const span = button.querySelector('span');
                const icon = button.querySelector('i.fa-dice-d20, i.fa-solid.fa-dice-d20');
                
                if (span?.textContent?.trim() === 'Roll' && icon) {
                    console.log("FFTweaks | Found midi-qol roll button, auto-clicking immediately...");
                    
                    // Click immediately without delay
                    (button as HTMLButtonElement).click();
                    console.log("FFTweaks | Auto-clicked roll button instantly");
                    
                    // Also try to hide the dialog immediately if possible
                    const dialog = button.closest('.dialog, .application');
                    if (dialog && dialog instanceof HTMLElement) {
                        dialog.style.display = 'none';
                    }
                }
            });
        }

        /**
         * Enables or disables the auto-roll functionality
         */
        static setEnabled(enabled: boolean): void {
            this.isEnabled = enabled;
            console.log(`FFTweaks | Midi Auto Roll ${enabled ? 'enabled' : 'disabled'}`);
        }

        /**
         * Stops the observer and cleans up
         */
        static cleanup(): void {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }
    }
}