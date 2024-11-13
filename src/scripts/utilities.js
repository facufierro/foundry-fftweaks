// Initialize FFT if not already defined
window.FFT = window.FFT || {};

FFT.UI = class {
    static createButton({ classes = [], icon = '', tooltip = '', onClick = null }) {
        const button = $(`<button type="button" class="${classes.join(' ')}" data-tooltip="${tooltip}"><i class="${icon}"></i></button>`);
        if (onClick) button.on('click', onClick);
        return button;
    }
};

FFT.Debug = class {

    static Log(message) {
        console.log(`%cFFTweaks | ${message}`, 'color: white; font-weight: bold;');
    }
    static Info(message) {
        console.log(`%cFFTweaks | ${message}`, 'color: blue; font-weight: bold;');
    }
    static Success(message) {
        console.log(`%cFFTweaks | ${message}`, 'color: green; font-weight: bold;');
    }
    static Warn(message) {
        console.warn(`%cFFTweaks | ${message}`, 'color: orange; font-weight: bold;');
    }
    static Error(message) {
        console.error(`%cFFTweaks | ${message}`, 'color: red; font-weight: bold;');
    }
};
