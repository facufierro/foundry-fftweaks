/**
 * Entry point for FFTweaks
 * Author: User
 * License: MIT
 */
(window as any).FFT = (window as any).FFT || {};

Hooks.once('init', () => {
    FFT.Debug.Log('FFTweaks | Initializing FFTweaks Module');
    FFT.DNDCustomizerModule.initialize();
});

Hooks.once('ready', () => {
    FFT.Debug.Log('FFTweaks | FFTweaks is active');
});
