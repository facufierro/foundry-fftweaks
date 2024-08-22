export function initialize(paused) {
    if (paused) {
        SimpleCalendar.api.pauseClock();
    } else {
        SimpleCalendar.api.startClock();
    }
}
