namespace FFT {
    export class FunctionBar {
        private readonly form: HTMLElement;

        constructor(options: {
            id?: string;
            position?: { top: string; left: string };
            buttons: Array<{
                id: string;
                title: string;
                icon: string;
                row: number;
                onClick: (event: Event) => void;
            }>;
        }) {
            const id = options.id ?? "fft-functionbar";
            const position = options.position ?? { top: "150px", left: "150px" };

            const existing = document.getElementById(id);
            if (existing) existing.remove();

            this.form = document.createElement("div");
            this.form.id = id;
            Object.assign(this.form.style, {
                position: "fixed",
                top: position.top,
                left: position.left,
                zIndex: "60",
                display: "flex",
                flexDirection: "column",
                padding: "0px",
                background: "rgb(11 10 19 / 75%)",
                border: "1px solid #111",
                boxShadow: "0 0 5px rgba(0,0,0,0.5)"
            });

            this.build(options.buttons);
        }

        private build(buttons: Array<{ id: string; title: string; icon: string; row: number; onClick: (event: Event) => void }>) {
            const handle = document.createElement("div");
            handle.id = `${this.form.id}-handle`;
            Object.assign(handle.style, {
                height: "20px",
                background: "rgb(0 0 0 / 50%)",
                cursor: "move",
                borderBottom: "1px solid #111"
            });

            this.form.appendChild(handle);
            FFT.makeDraggable(this.form, handle);

            const rows = new Map<number, HTMLElement[]>();

            for (const btn of buttons) {
                if (!rows.has(btn.row)) rows.set(btn.row, []);
                const button = new FFT.CustomButton({
                    id: btn.id,
                    tooltip: btn.title,
                    iconClass: btn.icon,
                    onClick: btn.onClick
                });
                const element = button.element;
                // Handle right-click as onClick via contextmenu
                element.addEventListener('contextmenu', (event: MouseEvent) => {
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

        render(): void {
            document.body.appendChild(this.form);
        }
    }
}
