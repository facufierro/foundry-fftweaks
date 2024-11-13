// src/debug.ts
namespace FFT {
    export class UI {
        static createButton({ classes = [], icon = '', tooltip = '', onClick = null }: {
            classes?: string[];
            icon?: string;
            tooltip?: string;
            onClick?: (() => void) | null;
        }): JQuery<HTMLElement> {
            const button = $(`<button type="button" class="${classes.join(' ')}" data-tooltip="${tooltip}"><i class="${icon}"></i></button>`);
            if (onClick) button.on('click', onClick);
            return button;
        }
        static test() {
            FFT.Debug.Warn("Test");
        }
    }
}


