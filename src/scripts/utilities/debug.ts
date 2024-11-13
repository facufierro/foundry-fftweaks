namespace FFT {
    export class Debug {
        static Log(message: string, ...args: any[]): void {
            console.log(`%cFFTweaks | ${message}`, 'color: cyan; font-weight: bold;', ...args);
        }

        static Success(message: string, ...args: any[]): void {
            console.log(`%cFFTweaks | ${message}`, 'color: green; font-weight: bold;', ...args);
        }

        static Warn(message: string, ...args: any[]): void {
            console.warn(`%cFFTweaks | ${message}`, 'color: orange; font-weight: bold;', ...args);
        }

        static Error(message: string, ...args: any[]): void {
            console.error(`%cFFTweaks | ${message}`, 'color: red; font-weight: bold;', ...args);
        }
    }
}
