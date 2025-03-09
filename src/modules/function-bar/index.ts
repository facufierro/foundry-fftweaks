namespace FFT.Modules {
    export class FunctionBar {
        static async initialize() {
            // Check if the user is a DM
            if (!game.user.isGM) {
                return;
            }

            const buttonData = await FFT.UI.fetchButtonData();

            // Transform button data into the required format
            const buttons = Object.entries(buttonData).map(([id, { name, icon, script }]) => ({
                id,
                title: name,
                icon,
                onClick: FFT.UI.resolveFunction(script),
            }));

            // Create the function bar
            FFT.UI.createForm({
                id: 'fft-functionbar',
                position: { top: '150px', left: '150px' },
                buttons,
            });
        }
    }
}
