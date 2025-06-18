namespace FFT {
    export class CustomDialog {
        private title: string;
        private content: string;
        private buttons: Record<string, DialogButton<unknown, HTMLElement | JQuery<HTMLElement>>>;
        private defaultButton: string;
        private options: Partial<DialogOptions>;

        constructor(
            title: string,
            content: string,
            buttons: Record<string, { label: string; callback: (html: HTMLElement | JQuery<HTMLElement>, event?: MouseEvent) => void }>,
            defaultButton: string = "yes",
            options: Partial<DialogOptions> = {}
        ) {
            this.title = title;
            this.content = content;
            this.buttons = Object.fromEntries(
                Object.entries(buttons).map(([key, { label, callback }]) => [
                    key, { label, callback }
                ])
            );
            this.defaultButton = defaultButton;
            this.options = options;
        }

        render(): void {
            new Dialog({
                title: this.title,
                content: this.content,
                buttons: this.buttons,
                default: this.defaultButton,
                ...this.options,
            }).render(true);
        }
    }
}
