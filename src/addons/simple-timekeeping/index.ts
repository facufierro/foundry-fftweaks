namespace FFT {
    export class SimpleTimekeepingAddon {
        static initialize(): void {
            const observer = new MutationObserver((mutations: MutationRecord[]) => {
                for (const mutation of mutations) {
                    const addedNodes = Array.from(mutation.addedNodes);
                    for (const node of addedNodes) {
                        if (node instanceof HTMLElement && node.id === "context-menu") {
                            node.classList.remove("expand-up");
                            node.style.bottom = null;
                            node.style.top = "unset";
                            node.style.maxHeight = "400px";
                            node.style.overflowY = "auto";

                            console.log("🛠️ Weather context menu adjusted.");
                        }
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }
    }
}
