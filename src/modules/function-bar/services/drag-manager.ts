namespace FFT {
    export function makeDraggable(element: HTMLElement, handle: HTMLElement): void {
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;

        const onMouseDown = (event: MouseEvent) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        const onMouseMove = (event: MouseEvent) => {
            offsetX = event.clientX - mouseX;
            offsetY = event.clientY - mouseY;
            mouseX = event.clientX;
            mouseY = event.clientY;
            const rect = element.getBoundingClientRect();
            element.style.left = rect.left + offsetX + "px";
            element.style.top = rect.top + offsetY + "px";
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        handle.addEventListener("mousedown", onMouseDown);
    }
}
