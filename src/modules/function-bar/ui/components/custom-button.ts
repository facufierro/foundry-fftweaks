namespace FFT {
    export class CustomButton {
        public readonly element: HTMLButtonElement;

        constructor(options: {
            id: string;
            tooltip: string;
            iconClass: string;
            onClick: (event: MouseEvent) => void;
            classes?: string[];
            ariaLabel?: string;
        }) {
            const {
                id,
                tooltip,
                iconClass,
                onClick,
                classes = [],
                ariaLabel = tooltip,
            } = options;

            this.element = document.createElement("button");
            this.element.id = id;
            this.element.type = "button";
            this.element.title = tooltip;
            this.element.classList.add("fft-button", ...classes);
            this.element.setAttribute("aria-label", ariaLabel);

            const icon = document.createElement("i");
            icon.className = iconClass;
            this.element.appendChild(icon);

            this.element.addEventListener("mouseenter", () => {
                icon.style.textShadow = "0 0 10px #ff6400";
            });
            this.element.addEventListener("mouseleave", () => {
                icon.style.textShadow = "none";
            });

            this.element.addEventListener("click", onClick);
        }

        attachTo(target: HTMLElement): void {
            target.appendChild(this.element);
        }
    }
}
