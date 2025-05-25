namespace FFT {
    export class LevelsAddon {
        static initialize(): void {
            try {
                Debug.Success("Initializing levels addon...");
                Hooks.on("canvasReady", () => LevelsAddon.selectGroundFloor());
            } catch (e) {
                console.error("Initialization error:", e);
            }
        }

        private static selectGroundFloor(): void {
            if (!game.user?.isGM) return;
            if (!this.activateLevelsControl()) return;

            setTimeout(() => this.selectFloorAndReturnToTokens(), 200);
        }

        private static activateLevelsControl(): boolean {
            const control = document.querySelector('li[data-control="levels"]') as HTMLLIElement;
            if (!control) return false;
            control.click();
            return true;
        }

        private static selectFloorAndReturnToTokens(): void {
            const floor = this.findFloorInput();
            if (!floor) return;

            floor.click();
            this.activateTokenControls();
        }

        private static findFloorInput(): HTMLInputElement | null {
            return document.querySelector(
                'input.level-name[value="0"], input.level-name[value="ground floor"], input.level-name[value="Ground Floor"]'
            ) as HTMLInputElement | null;
        }

        private static activateTokenControls(): void {
            const control = document.querySelector(
                'li[data-control="token"][data-canvas-layer="tokens"]'
            ) as HTMLLIElement | null;
            control?.click();
        }
    }
}
