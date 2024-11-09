export const Debug = {
    Log: function (message) {
        console.log(`%cFFTweaks | ${message}`, 'color: white; font-weight: bold;');
    },
    Info: function (message) {
        console.log(`%cFFTweaks | ${message}`, 'color: blue; font-weight: bold;');
    },
    Success: function (message) {
        console.log(`%cFFTweaks | ${message}`, 'color: green; font-weight: bold;');
    },
    Warn: function (message) {
        console.warn(`%cFFTweaks | ${message}`, 'color: orange; font-weight: bold;');
    },
    Error: function (message) {
        console.error(`%cFFTweaks | ${message}`, 'color: red; font-weight: bold;');
    }
};
