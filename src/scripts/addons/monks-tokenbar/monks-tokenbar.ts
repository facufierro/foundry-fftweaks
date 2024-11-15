namespace FFT.Addons {
    interface ButtonData {
        name: string;
        icon: string;
        row: number;
        script: string;
    }

    export class MonksTokenbar {
        static initialize() {
            const interval = setInterval(() => {
                const tokenBar = document.getElementById('tokenbar-controls');
                if (tokenBar) {
                    clearInterval(interval);
                    setInterval(() => this.populateTokenbar(), 50);
                }
            }, 100);
        }

        private static async fetchButtonData(): Promise<Record<string, ButtonData>> {
            try {
                const response = await fetch('modules/fftweaks/src/scripts/addons/monks-tokenbar/data/button-data.json');
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                return await response.json();
            } catch {
                return {};
            }
        }

        private static createButton(id: string, button: ButtonData): HTMLElement {
            return FFT.UI.createButton({
                id,
                classes: ['control-icon'],
                icon: button.icon,
                tooltip: button.name,
                onClick: (event: MouseEvent) => this.runScript(button.script, event),
            });
        }

        private static async runScript(script: string, event?: MouseEvent): Promise<void> {
            const func = script.split('.').reduce((obj, key) => obj?.[key], window);
            if (typeof func === "function") await func(event);
        }

        private static async populateTokenbar() {
            const buttonData = await this.fetchButtonData();
            const tokenBar = document.getElementById('tokenbar-controls');
            if (!tokenBar) return;

            const rows: Record<number, HTMLElement> = {};

            for (const [id, button] of Object.entries(buttonData)) {
                const rowId = `custom-tokenbar-row-${button.row}`;
                rows[button.row] = rows[button.row] || document.getElementById(rowId) || (() => {
                    const row = document.createElement('div');
                    row.id = rowId;
                    row.className = 'flexrow tokenbar-buttons';
                    tokenBar.appendChild(row);
                    return row;
                })();

                if (!document.getElementById(id)) {
                    rows[button.row].appendChild(this.createButton(id, button));
                }
            }
        }
    }
}
