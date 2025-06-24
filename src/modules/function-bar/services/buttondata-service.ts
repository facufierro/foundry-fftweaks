namespace FFT {
    interface KeyBindings {
        default: string;
        shift?: string;
        ctrl?: string;
        alt?: string;
        rightClick?: string;
    }

    export class ButtonDataService {
        static async loadButtons(): Promise<Array<{
            id: string;
            title: string;
            icon: string;
            row: number;
            onClick: (event: Event) => void;
        }>> {
            const response = await fetch("modules/fftweaks/src/modules/function-bar/data/button-data.json");

            if (!response.ok) {
                console.error("Failed to fetch button data:", response.statusText);
                return [];
            }

            const raw: Record<string, { name: string; icon: string; row: number; script?: string; keyBindings?: KeyBindings }> = await response.json();

            return Object.entries(raw).map(([id, { name, icon, row, script, keyBindings }]) => ({
                id,
                title: name,
                icon,
                row,
                onClick: FFT.ButtonDataService.createEventHandler(script, keyBindings)
            }));
        }

        static createEventHandler(script?: string, keyBindings?: KeyBindings): (event: Event) => void {
            return (event: Event) => {
                const mouseEvent = event as MouseEvent;
                let functionPath: string;

                if (keyBindings) {
                    // New key binding system
                    if (mouseEvent.button === 2) { // Right click
                        functionPath = keyBindings.rightClick || keyBindings.default;
                    } else if (mouseEvent.shiftKey) {
                        functionPath = keyBindings.shift || keyBindings.default;
                    } else if (mouseEvent.ctrlKey) {
                        functionPath = keyBindings.ctrl || keyBindings.default;
                    } else if (mouseEvent.altKey) {
                        functionPath = keyBindings.alt || keyBindings.default;
                    } else {
                        functionPath = keyBindings.default;
                    }
                } else if (script) {
                    // Legacy system - call the function with the event
                    const legacyFn = FFT.ButtonDataService.resolveFunction(script);
                    legacyFn(event);
                    return;
                } else {
                    console.error("No script or key bindings defined for button");
                    return;
                }

                const fn = FFT.ButtonDataService.resolveFunction(functionPath);
                fn();
            };
        }

        static resolveFunction(scriptPath: string): (...args: any[]) => void {
            const parts = scriptPath.split(".");
            let fn: any = window;
            for (const part of parts) {
                fn = fn?.[part];
            }

            if (typeof fn === "function") return fn;
            console.error(`Invalid script path: ${scriptPath}`);
            return () => { };
        }
    }
}
