namespace FFT {
    export class FunctionBarModule {
        static async initialize(): Promise<void> {
            if (!game.user?.isGM) return;

            const buttonConfigs = await FFT.ButtonDataService.loadButtons();

            const functionBar = new FFT.FunctionBar({
                id: "fft-functionbar",
                position: { top: "150px", left: "150px" },
                buttons: buttonConfigs
            });

            functionBar.render();
        }
    }
}
