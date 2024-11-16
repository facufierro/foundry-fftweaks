namespace FFT {
    export class UI {
        // Fetch button data from JSON
        static async fetchButtonData(): Promise<Record<string, { name: string; icon: string; script: string }>> {
            const response = await fetch('modules/fftweaks/src/modules/function-bar/data/button-data.json');
            if (!response.ok) {
                console.error("Failed to fetch button data:", response.statusText);
                return {};
            }
            return await response.json();
        }

        // Create the function bar with provided button data
        static createFunctionBar(buttonData: Record<string, { name: string; icon: string; script: string }>) {
            // Remove existing function bar if it exists
            const existingFunctionBar = document.getElementById('fft-functionbar');
            if (existingFunctionBar) existingFunctionBar.remove();

            // Create the main container
            const functionBar = document.createElement('div');
            functionBar.id = 'fft-functionbar';
            Object.assign(functionBar.style, {
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

            // Create the move handle (plain bar without icon)
            const moveHandle = document.createElement('div');
            moveHandle.id = 'fft-functionbar-handle';
            Object.assign(moveHandle.style, {
                width: '100%',
                height: '20px',
                background: 'rgb(0 0 0 / 50%)',
                cursor: 'move',
                borderBottom: '1px solid #111',
            });

            functionBar.appendChild(moveHandle);

            // Create and append buttons
            const buttonRow = document.createElement('div');
            Object.assign(buttonRow.style, {
                display: 'flex',
                flexDirection: 'row',
                gap: '4px',
            });

            Object.entries(buttonData).forEach(([id, button]) => {
                const { name, icon, script } = button;

                // Resolve the script function
                const onClick = this.resolveFunction(script);
                if (!onClick) {
                    console.error(`Function "${script}" not found.`);
                    return;
                }

                const buttonElem = this.createButton(id, name, icon, onClick);
                buttonRow.appendChild(buttonElem);
            });

            functionBar.appendChild(buttonRow);

            // Make the function bar draggable
            this.makeDraggable(functionBar, moveHandle);

            // Append to document body
            document.body.appendChild(functionBar);
        }

        // Helper function to create a button
        static createButton(id: string, title: string, icon: string, onClick: (event: Event) => void): HTMLElement {
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
            iconElem.className = icon;
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

        // Helper function to make the bar draggable
        static makeDraggable(element: HTMLElement, handle: HTMLElement) {
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
            handle.addEventListener('mousedown', onMouseDown);
        }
    }
}
