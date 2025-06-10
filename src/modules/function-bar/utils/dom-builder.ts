export class DOMBuilder {
    static applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
        Object.assign(element.style, styles);
    }

    static createElement<K extends keyof HTMLElementTagNameMap>(
        tag: K,
        options?: { id?: string; classes?: string[]; attributes?: Record<string, string> }
    ): HTMLElementTagNameMap[K] {
        const element = document.createElement(tag);
        if (options?.id) element.id = options.id;
        if (options?.classes) element.classList.add(...options.classes);
        if (options?.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                element.setAttribute(key, value);
            }
        }
        return element;
    }
}
