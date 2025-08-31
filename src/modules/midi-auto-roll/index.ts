namespace FFT {
    export class MidiAutoRollModule {
        private static observer: MutationObserver | null = null;
        private static isEnabled = true;

        /**
         * Initializes the auto-roll module that automatically clicks midi-qol roll buttons
         */
        static initialize(): void {
            console.log("FFTweaks | Initializing Midi Auto Roll module");
            
            // Start observing for midi-qol dialogs
            this.startObserver();
            
            // Also check immediately in case there are already dialogs open
            this.checkForRollButtons();
        }

        /**
         * Starts the mutation observer to watch for new dialogs
         */
        private static startObserver(): void {
            this.observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        // Check if any new nodes contain roll buttons
                        Array.from(mutation.addedNodes).forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.checkElementForRollButtons(node as Element);
                            }
                        });
                    }
                }
            });

            // Start observing the document body for changes
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
         * Checks a specific element and its children for roll buttons
         */
        private static checkElementForRollButtons(element: Element): void {
            if (!this.isEnabled) return;

            // Look for the specific roll button
            const rollButtons = element.querySelectorAll('button[data-action="roll"]');
            
            Array.from(rollButtons).forEach(button => {
                // Additional check to make sure it's the midi-qol roll button
                const span = button.querySelector('span');
                const icon = button.querySelector('i.fa-dice-d20');
                
                if (span?.textContent?.trim() === 'Roll' && icon) {
                    console.log("FFTweaks | Found midi-qol roll button, auto-clicking...");
                    
                    // Small delay to ensure the dialog is fully rendered
                    setTimeout(() => {
                        (button as HTMLButtonElement).click();
                        console.log("FFTweaks | Auto-clicked roll button");
                    }, 100);
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