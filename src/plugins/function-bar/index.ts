import type { Button } from "./interfaces/button";
import type { KeyBindings } from "./interfaces/keybindings";

export class FunctionBar {
    private form: HTMLElement;

    private constructor(buttons: Button[]) {
        const existing = document.getElementById("fft-functionbar");
        if (existing) existing.remove();

        this.form = document.createElement("div");
        this.form.id = "fft-functionbar";
        Object.assign(this.form.style, {
            position: "fixed",
            top: "150px",
            left: "150px",
            zIndex: "60",
            display: "flex",
            flexDirection: "column",
            padding: "0px",
            background: "rgb(11 10 19 / 75%)",
            border: "1px solid #111",
            boxShadow: "0 0 5px rgba(0,0,0,0.5)"
        });

        this.buildUI(buttons);
        this.render();
    }

    static async initialize(): Promise<void> {
        if (!game.user?.isGM) return;

        const buttons = await this.loadButtons();
        new FunctionBar(buttons);
    }

    private buildUI(buttons: Button[]): void {
        const handle = document.createElement("div");
        Object.assign(handle.style, {
            height: "20px",
            background: "rgb(0 0 0 / 50%)",
            cursor: "move",
            borderBottom: "1px solid #111"
        });
        this.form.appendChild(handle);
        this.makeDraggable(handle);

        const rows = new Map<number, HTMLElement[]>();

        for (const btn of buttons) {
            if (!rows.has(btn.row)) rows.set(btn.row, []);

            const element = document.createElement("button");
            element.type = "button";
            element.title = btn.title;
            Object.assign(element.style, {
                width: "32px",
                height: "32px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #111",
                background: "rgb(0 0 0 / 35%)",
                color: "#ddd",
                cursor: "pointer",
                borderRadius: "4px"
            });

            const icon = document.createElement("i");
            icon.className = btn.icon;
            element.appendChild(icon);

            element.addEventListener("click", btn.onClick);
            element.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                btn.onClick(event);
            });

            rows.get(btn.row)!.push(element);
        }

        [...rows.keys()].sort().forEach((rowNum) => {
            const rowContainer = document.createElement("div");
            Object.assign(rowContainer.style, {
                display: "flex",
                flexDirection: "row",
                gap: "4px",
                padding: "4px"
            });
            rows.get(rowNum)!.forEach(btn => rowContainer.appendChild(btn));
            this.form.appendChild(rowContainer);
        });
    }

    private makeDraggable(handle: HTMLElement): void {
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;

        const onMouseMove = (event: MouseEvent) => {
            offsetX = event.clientX - mouseX;
            offsetY = event.clientY - mouseY;
            mouseX = event.clientX;
            mouseY = event.clientY;
            const rect = this.form.getBoundingClientRect();
            this.form.style.left = rect.left + offsetX + "px";
            this.form.style.top = rect.top + offsetY + "px";
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        handle.addEventListener("mousedown", (event: MouseEvent) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }

    private render(): void {
        document.body.appendChild(this.form);
    }


    private static async loadButtons(): Promise<Button[]> {
        const response = await fetch("modules/fftweaks/src/plugins/function-bar/data/button-data.json");
        if (!response.ok) {
            console.error("Failed to fetch button data:", response.statusText);
            return [];
        }

        const raw: Record<string, {
            name: string;
            icon: string;
            row: number;
            script?: string;
            keyBindings?: KeyBindings
        }> = await response.json();

        return Object.entries(raw).map(([id, { name, icon, row, script, keyBindings }]) => ({
            id,
            title: name,
            icon,
            row,
            onClick: this.createEventHandler(script, keyBindings)
        }));
    }

    private static createEventHandler(script?: string, keyBindings?: KeyBindings): (event: Event) => void {
        return (event: Event) => {
            const mouseEvent = event as MouseEvent;
            let functionPath: string;

            if (keyBindings) {
                if (mouseEvent.button === 2) {
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
                const legacyFn = this.resolveFunction(script);
                legacyFn(event);
                return;
            } else {
                console.error("No script or key bindings defined for button");
                return;
            }

            const fn = this.resolveFunction(functionPath);
            fn();
        };
    }

    private static resolveFunction(scriptPath: string): (...args: any[]) => void {
        const functionCallMatch = scriptPath.match(/^(.+?)\((.*)?\)$/);

        if (functionCallMatch) {
            const [, functionPath, argsString] = functionCallMatch;
            const parts = functionPath.split(".");
            let fn: any = window;
            for (const part of parts) {
                fn = fn?.[part];
            }

            if (typeof fn === "function") {
                let args: any[] = [];
                if (argsString?.trim()) {
                    try {
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
                    }
                }
                return () => fn(...args);
            }
        } else {
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
