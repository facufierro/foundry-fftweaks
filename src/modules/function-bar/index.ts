namespace FFT {
    export class FunctionBarModule {
        static async initialize() {
            if (!game.user.isGM) {
                return;
            }

            const buttonData = await UI.fetchButtonData();

            const buttons = Object.entries(buttonData).map(([id, { name, icon, script, row }]) => ({
                id,
                title: name,
                icon,
                row,
                onClick: UI.resolveFunction(script),
            }));



            UI.createForm({
                id: 'fft-functionbar',
                position: { top: '150px', left: '150px' },
                buttons,
            });
        }
    }
}
