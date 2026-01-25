export class Debug {
    private static formatArgs(args: any[]): any[] {
        return args.map(arg => {
            if (typeof arg === "object") {
                try {
                    return JSON.stringify(arg, null, 2); // Pretty-print objects/arrays
                } catch {
                    return arg; // Fallback in case JSON serialization fails
                }
            }
            return arg;
        });
    }

    static Log(message: any, ...args: any[]): void {
        console.log(`%c[FFTweaks] ${message}`, 'color: cyan; font-weight: bold;', ...this.formatArgs(args));
    }

    static Success(message: any, ...args: any[]): void {
        console.log(`%c[FFTweaks] ${message}`, 'color: green; font-weight: bold;', ...this.formatArgs(args));
    }

    static Warn(message: any, ...args: any[]): void {
        console.warn(`%c[FFTweaks] ${message}`, 'color: orange; font-weight: bold;', ...this.formatArgs(args));
    }

    static Error(message: any, ...args: any[]): void {
        console.error(`%c[FFTweaks] ${message}`, 'color: red; font-weight: bold;', ...this.formatArgs(args));
    }
}
