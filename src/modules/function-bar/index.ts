namespace FFT.Modules {
    export class FunctionBar {
        static async initialize() {
            if (!game.user.isGM) {
                return;
            }

            const buttonData = await FFT.UI.fetchButtonData();

            const buttons = Object.entries(buttonData).map(([id, { name, icon, script }]) => ({
                id,
                title: name,
                icon,
                onClick: FFT.UI.resolveFunction(script),
            }));

            FFT.UI.createForm({
                id: 'fft-functionbar',
                position: { top: '150px', left: '150px' },
                buttons,
            });
        }
    }
}
