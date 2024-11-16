namespace FFT.Addons {
    export class FunctionBar {
        static async initialize() {
            const buttonData = await FFT.UI.fetchButtonData();
            FFT.UI.createFunctionBar(buttonData);
        }
    }
}

