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
            // Check if the scriptPath contains parameters (e.g., "FFT.Functions.healTokens(5)")
            const functionCallMatch = scriptPath.match(/^(.+?)\((.*)?\)$/);
            
            if (functionCallMatch) {
                // Handle function calls with parameters
                const [, functionPath, argsString] = functionCallMatch;
                const parts = functionPath.split(".");
                let fn: any = window;
                for (const part of parts) {
                    fn = fn?.[part];
                }

                if (typeof fn === "function") {
                    // Parse arguments
                    let args: any[] = [];
                    if (argsString && argsString.trim()) {
                        try {
                            // Simple argument parsing for basic types
                            args = argsString.split(',').map(arg => {
                                arg = arg.trim();
                                if (arg === 'true') return true;
                                if (arg === 'false') return false;
                                if (arg === 'null') return null;
                                if (arg === 'undefined') return undefined;
                                if (/^\d+$/.test(arg)) return parseInt(arg, 10);
                                if (/^\d*\.\d+$/.test(arg)) return parseFloat(arg);
                                if (arg.startsWith('"') && arg.endsWith('"')) return arg.slice(1, -1);
                                if (arg.startsWith("'") && arg.endsWith("'")) return arg.slice(1, -1);
                                return arg;
                            });
                        } catch (e) {
                            console.error(`Error parsing arguments for ${scriptPath}:`, e);
                            args = [];
                        }
                    }
                    
                    return () => fn(...args);
                }
            } else {
                // Handle simple function paths without parameters
                const parts = scriptPath.split(".");
                let fn: any = window;
                for (const part of parts) {
                    fn = fn?.[part];
                }

                if (typeof fn === "function") return fn;
            }
            
            console.error(`Invalid script path: ${scriptPath}`);
            return () => { };
        }
    }
}
