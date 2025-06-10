namespace FFT {
    export class UI {
        static initialize() { }
        // Crate sheet button
        static createSheetButton() { }

        // Create function bar
        static createForm({
            id = 'fft-functionbar',
            position = { top: '150px', left: '150px' },
            buttons = [],
        }: {
            id?: string;
            position?: { top: string; left: string };
            buttons: Array<{ id: string; title: string; icon: string; row: number; onClick: (event: Event) => void }>

        }): HTMLElement {
            // Remove existing form if it exists
            const existingForm = document.getElementById(id);
            if (existingForm) existingForm.remove();

            // Create the main container with original styles
            const form = document.createElement('div');
            form.id = id;
            Object.assign(form.style, {
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: '60',
                display: 'flex',
                flexDirection: 'column',
                padding: '0px',
                background: 'rgb(11 10 19 / 75%)',
                border: '1px solid #111',
                borderRadius: '0',
                boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
            });

            // Create the move handle with original styles
            const moveHandle = document.createElement('div');
            moveHandle.id = `${id}-handle`;
            Object.assign(moveHandle.style, {
                width: '100%',
                height: '20px',
                background: 'rgb(0 0 0 / 50%)',
                cursor: 'move',
                borderBottom: '1px solid #111',
            });

            form.appendChild(moveHandle);

            // Create and append button container
            const buttonRow = document.createElement('div');
            Object.assign(buttonRow.style, {
                display: 'flex',
                flexDirection: 'row',
                gap: '4px',
                padding: '4px',
            });

            // Group buttons by row
            const rows = new Map<number, HTMLElement[]>();
            buttons.forEach(({ id, title, icon, row = 1, onClick }) => {
                if (!rows.has(row)) rows.set(row, []);
                rows.get(row)!.push(this.createButton(id, title, icon, onClick));
            });

            // Add each row to the form
            [...rows.keys()].sort().forEach((rowNum) => {
                const rowContainer = document.createElement('div');
                Object.assign(rowContainer.style, {
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '4px',
                    padding: '4px',
                });

                rows.get(rowNum)!.forEach((btn) => rowContainer.appendChild(btn));
                form.appendChild(rowContainer);
            });


            // Make the form draggable
            this.makeDraggable(form, moveHandle);

            // Append to the document body
            document.body.appendChild(form);

            return form;
        }

        // Create function bar button
        static createFunctionBarButton() { }




        // Fetch button data from JSON
        static async fetchButtonData(): Promise<Record<string, { name: string; icon: string; script: string; row: number }>> {
            const response = await fetch('modules/fftweaks/src/modules/function-bar/data/button-data.json');
            if (!response.ok) {
                console.error("Failed to fetch button data:", response.statusText);
                return {};
            }
            return await response.json();
        }


        // Helper function to create a button with original styles
        static createButton(id: string, title: string, icon: string, onClick: (event: Event) => void): HTMLElement {
            const buttonElem = document.createElement('button');
            buttonElem.id = id;
            buttonElem.title = title;
            Object.assign(buttonElem.style, {
                width: '28px',
                height: '28px',
                background: 'rgb(0 0 0 / 0%)',
                border: '1px solid transparent',
                borderRadius: '4px',
                color: '#c9c7b8',
                textAlign: 'center',
                margin: '0',
                cursor: 'pointer',
                padding: '0',
                boxSizing: 'border-box',
                boxShadow: 'none',
                transition: 'box-shadow 0.2s ease',
            });

            const iconElem = document.createElement('i');
            iconElem.className = icon;
            Object.assign(iconElem.style, {
                color: '#c9c7b8',
                fontFamily: 'Font Awesome 6 Pro',
                lineHeight: '28px',
                marginRight: '0',
                transition: 'text-shadow 0.2s ease',
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

        // Helper function to resolve a script function path
        static resolveFunction(scriptPath: string): ((event: Event) => void) | null {
            try {
                const scriptParts = scriptPath.split('.');
                let func = window as any;
                for (const part of scriptParts) {
                    func = func[part];
                    if (!func) break;
                }
                if (typeof func === 'function') {
                    return func;
                } else {
                    console.error(`"${scriptPath}" is not a valid function.`);
                    return null;
                }
            } catch (error) {
                console.error(`Error resolving function "${scriptPath}":`, error);
                return null;
            }
        }

        // Helper function to make the form draggable
        static makeDraggable(element: HTMLElement, handle: HTMLElement) {
            let offsetX = 0,
                offsetY = 0,
                mouseX = 0,
                mouseY = 0;
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
            handle.addEventListener('mousedown', onMouseDown);
        }
    }
}
