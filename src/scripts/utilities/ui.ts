namespace FFT {
    export class UI {
        static createButton({
            id = '',
            classes = [],
            icon = '',
            tooltip = '',
            onClick = null,
        }: {
            id?: string;
            classes?: string[];
            icon?: string;
            tooltip?: string;
            onClick?: ((event: MouseEvent) => void) | null; // Allow onClick to accept an event
        }): HTMLDivElement {
            const button = document.createElement('div');
            if (id) button.id = id;
            button.className = ['control-icon', ...classes].join(' ');
            if (tooltip) button.title = tooltip;
            button.innerHTML = `<i class="${icon}"></i>`;
            if (onClick) button.addEventListener('click', onClick); // Pass event automatically
            return button;
        }

    }
}



