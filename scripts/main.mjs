import * as characterAnvil from './characterAnvil/index.js';
import * as tokenBarExtender from './tokenBarExtender/index.js';
import * as autoTimer from './autoTimer/index.js';

Hooks.once('ready', () => {
    characterAnvil.initialize();
    tokenBarExtender.initialize();
});

Hooks.on('renderActorSheet5e', (sheet, html, data) => {
    characterAnvil.initializeUI(html, sheet.actor);

});

Hooks.on("pauseGame", (paused) => {
    autoTimer.initialize(paused);
});
