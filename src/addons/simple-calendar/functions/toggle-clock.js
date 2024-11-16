export function toggleClock() {
    Hooks.on('pauseGame', (paused) => {
        if (paused) {
            SimpleCalendar.api.pauseClock();
        } else {
            SimpleCalendar.api.startClock();
        }
    });
}