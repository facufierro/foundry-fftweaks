namespace FFT.Addons {
    interface ButtonData {
        name: string;
        icon: string;
        row: number;
        script: string;
    }

    export class ActionBar {
        static async initialize() {
            const existingActionBar = document.getElementById('fft-actionbar');
            if (existingActionBar) existingActionBar.remove();

            const actionBar = document.createElement('div');
            actionBar.id = 'fft-actionbar';
            Object.assign(actionBar.style, {
                position: 'fixed',
                top: '150px',
                left: '150px',
                zIndex: '60',
                display: 'flex',
                flexDirection: 'column',
                padding: '0px',
                background: 'rgb(11 10 19 / 75%)',
                border: '1px solid #111',
                borderRadius: '0',
                boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
            });

            const buttonData = await this.fetchButtonData();

            const rows = this.createRows(buttonData);

            Object.values(rows).forEach(row => actionBar.appendChild(row));

            document.body.appendChild(actionBar);
            this.makeDraggable(actionBar);
        }

        static async fetchButtonData(): Promise<Record<string, ButtonData>> {
            const response = await fetch('modules/fftweaks/src/scripts/addons/monks-tokenbar/data/button-data.json');
            return await response.json();
        }

        static createButton(id: string, title: string, iconClass: string, onClick: (event: Event) => void) {
            const buttonElem = document.createElement('button');
            buttonElem.id = id;
            buttonElem.title = title;
            Object.assign(buttonElem.style, {
                width: '28px',
                height: '28px',
                background: 'rgb(0 0 0 / 0%)', // Default background is transparent
                border: '1px solid transparent',
                borderRadius: '4px',
                color: '#c9c7b8',
                textAlign: 'center',
                margin: '0',
                cursor: 'pointer',
                padding: '0',
                boxSizing: 'border-box',
                boxShadow: 'none', // Default no shadow
                transition: 'box-shadow 0.2s ease', // Smooth transition for hover effect
            });

            const iconElem = document.createElement('i');
            iconElem.className = iconClass;
            Object.assign(iconElem.style, {
                color: '#c9c7b8',
                fontFamily: 'Font Awesome 6 Pro',
                lineHeight: '28px',
                marginRight: '0',
                transition: 'text-shadow 0.2s ease', // Smooth transition for hover effect
            });

            buttonElem.appendChild(iconElem);

            buttonElem.addEventListener('mouseenter', () => {
                iconElem.style.textShadow = '0 0 10px #ff6400'; // Glow effect
            });

            buttonElem.addEventListener('mouseleave', () => {
                iconElem.style.textShadow = 'none'; // Remove glow effect
            });

            buttonElem.addEventListener('click', onClick);

            return buttonElem;
        }

        static createRows(buttonData: Record<string, ButtonData>) {
            const rows: Record<number, HTMLElement> = {};
            const columns = 3; // Buttons per row
            const buttons = Object.entries(buttonData);

            for (let i = 0; i < buttons.length; i += columns) {
                const row = document.createElement('div');
                row.className = 'fft-actionbar-buttons';
                Object.assign(row.style, {
                    display: 'flex',
                    flexDirection: 'row', // Align buttons horizontally
                    gap: '4px',
                });

                buttons.slice(i, i + columns).forEach(([id, button]) => {
                    const { name, icon, script } = button;

                    const newButton = this.createButton(
                        id,
                        name,
                        icon,
                        (event) => import(script).then(m => m.default?.(event))
                    );

                    row.appendChild(newButton);
                });

                rows[i / columns] = row;
            }
            return rows;
        }

        static makeDraggable(element: HTMLElement) {
            let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
            const onMouseDown = (event: MouseEvent) => {
                mouseX = event.clientX;
                mouseY = event.clientY;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };
            const onMouseMove = (event: MouseEvent) => {
                offsetX = event.clientX - mouseX;
                offsetY = event.clientY - mouseY;
                mouseX = event.clientX;
                mouseY = event.clientY;
                const rect = element.getBoundingClientRect();
                element.style.left = rect.left + offsetX + 'px';
                element.style.top = rect.top + offsetY + 'px';
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            element.addEventListener('mousedown', onMouseDown);
        }
    }
}
