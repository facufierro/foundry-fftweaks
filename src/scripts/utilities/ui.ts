namespace FFT {
    export class UI {
        static createButton({
            id = '', // Optional ID
            classes = [], // CSS classes
            icon = '', // Icon class
            tooltip = '', // Tooltip text
            onClick = null, // Click handler
        }: {
            id?: string;
            classes?: string[];
            icon?: string;
            tooltip?: string;
            onClick?: (() => void) | null;
        }): HTMLDivElement {
            const button = document.createElement('div');
            if (id) button.id = id;
            button.className = ['control-icon', ...classes].join(' ');
            if (tooltip) button.title = tooltip;
            button.innerHTML = `<i class="${icon}"></i>`;
            if (onClick) button.addEventListener('click', onClick);
            return button;
        }
    }
}



