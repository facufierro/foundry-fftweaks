/**
 * Entry point for FFTweaks
 * Author: User
 * License: MIT
 */

import './types/dnd5e.d.ts';

Hooks.once('init', () => {
    console.log('FFTweaks | Initializing FFTweaks Module');
    FFT.DNDCustomizerModule.initialize();
});

Hooks.once('ready', () => {
    console.log('FFTweaks | FFTweaks is active');
});
