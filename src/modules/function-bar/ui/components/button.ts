namespace FFT {
    export class CustomButton {
        public element: HTMLButtonElement;

        constructor(options: {
            id: string;
            tooltip: string;
            iconClass: string;
            onClick: (event: MouseEvent) => void;
            classes?: string[]; // optional extra CSS classes
            ariaLabel?: string;
        }) {
            const {
                id,
                tooltip,
                iconClass,
                onClick,
                classes = [],
                ariaLabel = tooltip
            } = options;

            this.element = document.createElement("button");
            this.element.id = id;
            this.element.type = "button";
            this.element.classList.add("gold-button", ...classes);
            this.element.dataset.tooltip = tooltip;
            this.element.setAttribute("aria-label", ariaLabel);

            const icon = document.createElement("i");
            icon.className = iconClass;
            this.element.appendChild(icon);

            this.element.addEventListener("click", onClick);
        }

        appendTo(target: HTMLElement | JQuery<HTMLElement>): void {
            const elem = target instanceof $ ? target[0] : target;
            elem.appendChild(this.element);
        }

        prependTo(target: HTMLElement | JQuery<HTMLElement>): void {
            const elem = target instanceof $ ? target[0] : target;
            elem.insertBefore(this.element, elem.firstChild);
        }

        insertBefore(target: HTMLElement | JQuery<HTMLElement>): void {
            const elem = target instanceof $ ? target[0] : target;
            elem.parentElement?.insertBefore(this.element, elem);
        }

        insertAfter(target: HTMLElement | JQuery<HTMLElement>): void {
            const elem = target instanceof $ ? target[0] : target;
            elem.parentElement?.insertBefore(this.element, elem.nextSibling);
        }
    }
}
