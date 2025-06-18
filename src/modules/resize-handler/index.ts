namespace FFT {
    export class ResizeHandler {
        static initialize() {
            Hooks.on("renderItemSheet", (app: Application, html: JQuery<HTMLElement>) => {
                // Skip if already present
                if (html.find(".window-resizable-handle").length > 0) return;

                const handle = $(`
                  <div class="window-resizable-handle">
                    <i class="fas fa-arrows-alt"></i>
                  </div>
                `);

                html.append(handle);

                // Native-style resizing
                let isResizing = false;
                let startX = 0;
                let startY = 0;
                let startHeight: number =
                    typeof app.position.height === "number"
                        ? app.position.height
                        : html.height() ?? 300;

                let startWidth: number =
                    typeof app.position.width === "number"
                        ? app.position.width
                        : html.width() ?? 400;


                handle.on("mousedown", (event: JQuery.MouseDownEvent) => {
                    event.preventDefault();
                    isResizing = true;

                    const h = app.position.height;
                    const w = app.position.width;

                    startHeight = typeof h === "number" ? h : html.height() ?? 300;
                    startWidth = typeof w === "number" ? w : html.width() ?? 400;

                    startX = event.clientX;
                    startY = event.clientY;

                    $(window)
                        .on("mousemove.resizing", (e: JQuery.MouseMoveEvent) => {
                            if (!isResizing) return;
                            const dx = e.clientX - startX;
                            const dy = e.clientY - startY;

                            app.setPosition({
                                width: startWidth + dx,
                                height: startHeight + dy,
                            });
                        })
                        .on("mouseup.resizing", () => {
                            isResizing = false;
                            $(window).off(".resizing");
                        });
                });

            });

        }
    }
}
