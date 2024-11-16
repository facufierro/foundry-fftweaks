namespace FFT.Addons {
    export class ActionBar {
        static initialize() {
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
                flexDirection: 'column', // Stack rows vertically
                gap: '4px',
                padding: '0px',
                background: 'rgb(11 10 19 / 75%)',
                border: '1px solid #111',
                borderRadius: '0', // Set to 0 to remove rounded edges
                boxShadow: '0 0 5px rgba(0, 0, 0, 0.5)'
            });


            const buttons = [
                { iconClass: 'fa fa-running', tooltip: 'Move' },
                { iconClass: 'fa fa-street-view', tooltip: 'Interact' },
                { iconClass: 'fa fa-fist-raised', tooltip: 'Action' },
                { iconClass: 'fa fa-tools', tooltip: 'Tools' },
                { iconClass: 'fas fa-people-arrows', tooltip: 'Team' },
                { iconClass: 'fas fa-book-medical', tooltip: 'More' }
            ];

            // Split buttons into rows (e.g., 3 buttons per row)
            const columns = 3;
            const rows = Math.ceil(buttons.length / columns);

            for (let i = 0; i < rows; i++) {
                const row = document.createElement('div');
                row.className = 'fft-actionbar-buttons';
                Object.assign(row.style, {
                    display: 'flex',
                    flexDirection: 'row', // Align buttons horizontally
                    gap: '4px',
                    margin: '4px 0', // Add margin to each row (columns)
                });

                buttons.slice(i * columns, i * columns + columns).forEach(button => {
                    const buttonElem = document.createElement('button');
                    buttonElem.title = button.tooltip;
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
                        transition: 'box-shadow 0.2s ease' // Smooth transition for hover effect
                    });

                    const iconElem = document.createElement('i');
                    iconElem.className = button.iconClass;
                    Object.assign(iconElem.style, {
                        color: '#c9c7b8',
                        fontFamily: 'Font Awesome 6 Pro',
                        lineHeight: '28px',
                        marginRight: '0',
                        transition: 'text-shadow 0.2s ease' // Smooth transition for hover effect
                    });

                    buttonElem.appendChild(iconElem);

                    buttonElem.addEventListener('mouseenter', () => {
                        iconElem.style.textShadow = '0 0 10px #ff6400'; // Glow effect
                    });

                    buttonElem.addEventListener('mouseleave', () => {
                        iconElem.style.textShadow = 'none'; // Remove glow effect
                    });

                    row.appendChild(buttonElem);
                });

                actionBar.appendChild(row);
            }


            document.body.appendChild(actionBar);
            this.makeDraggable(actionBar);
        }

        static makeDraggable(element) {
            let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
            const onMouseDown = (event) => {
                mouseX = event.clientX;
                mouseY = event.clientY;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };
            const onMouseMove = (event) => {
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
