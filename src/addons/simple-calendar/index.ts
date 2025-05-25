namespace FFT {
    export class SimpleCalendarAddon {
        static initialize() {
            Hooks.on('pauseGame', (paused) => {
                const SC: any = (window as any).SimpleCalendar;

                if (SC?.api) {
                    if (paused) {
                        SC.api.pauseClock();
                    } else {
                        SC.api.startClock();
                    }
                } else {
                    console.warn("SimpleCalendar API is not available.");
                }
            });
        }
    }
}
