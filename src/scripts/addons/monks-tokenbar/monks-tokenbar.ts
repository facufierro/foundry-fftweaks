namespace FFT.Addons {
    interface ButtonData {
        name: string;
        icon: string;
        row: number;
        script: string; // Name of a registered global function
    }

    export class MonksTokenbar {
        // Initialize and observe token bar
        static initialize() {
            const setupTokenBar = () => {
                const tokenBar = document.getElementById('tokenbar-controls');
                if (tokenBar) {
                    clearInterval(interval);
                    this.populateTokenbar();

                    // Observe DOM for changes
                    new MutationObserver(() => {
                        if (!document.querySelector('[id^="custom-tokenbar-row"]')) this.populateTokenbar();
                    }).observe(document.body, { childList: true, subtree: true });
                }
            };

            const interval = setInterval(setupTokenBar, 100);
        }

        // Fetch button data
        private static async fetchButtonData(): Promise<Record<string, ButtonData>> {
            try {
                const response = await fetch('modules/fftweaks/src/scripts/addons/monks-tokenbar/data/button-data.json');
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                return await response.json();
            } catch (error) {
                Debug.Error("Failed to fetch button data:", error);
                return {};
            }
        }

        // Create a button element
        private static createButton(id: string, button: ButtonData): HTMLElement {
            return FFT.UI.createButton({
                id,
                classes: ['control-icon'],
                icon: button.icon,
                tooltip: button.name,
                onClick: () => this.runScript(button.script),  // Call the function via script name
            });
        }

        // Run a global function
        private static async runScript(script: string): Promise<void> {
            try {
                // Locate the function in the global namespace
                const func = script.split('.').reduce((obj, key) => obj?.[key], window);

                if (typeof func === "function") {
                    await func();
                } else {
                    // Show a notification if the function is not found
                    ui.notifications?.warn(`Function "${script}" not implemented.`);
                }
            } catch (error) {
                ui.notifications?.warn(`Failed to execute function "${script}".`);
                Debug.Error(`Failed to execute script: ${script}`, error);
            }
        }


        // Create and append buttons to token bar
        private static async populateTokenbar() {
            const buttonData = await this.fetchButtonData();
            const tokenBar = document.getElementById('tokenbar-controls');
            if (!tokenBar) {
                Debug.Error("Token bar not found!");
                return;
            }

            // Clear previous custom rows
            document.querySelectorAll('[id^="custom-tokenbar-row"]').forEach(row => row.remove());

            // Organize buttons into rows
            const rows: Record<number, HTMLElement> = {};
            for (const [id, button] of Object.entries(buttonData)) {
                rows[button.row] = rows[button.row] || document.createElement('div');
                rows[button.row].id = `custom-tokenbar-row-${button.row}`;
                rows[button.row].className = 'flexrow tokenbar-buttons';
                rows[button.row].appendChild(this.createButton(id, button));
            }

            // Append rows to token bar
            Object.values(rows).forEach(row => tokenBar.appendChild(row));
            Debug.Success("Token bar updated with buttons.");
        }
    }
}
