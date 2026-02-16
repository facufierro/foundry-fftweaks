/**
 * ConsoleCapture - Bare minimum console capture utility.
 * Captures all console logs and saves them to a file via Foundry's FilePicker.
 * Filters out Foundry's upload messages to prevent infinite loops and console bloat.
 */
export class ConsoleCapture {
    private static buffer: string[] = [];
    private static fullLog = "";
    private static flushInterval: number | null = null;
    private static isReady = false;
    private static isFlushing = false;

    private static readonly FLUSH_INTERVAL_MS = 2000;
    private static readonly UPLOAD_PATH = "modules/fftweaks";
    private static readonly FILE_NAME = "console.txt";

    // Original console methods
    private static originalLog = console.log.bind(console);
    private static originalWarn = console.warn.bind(console);
    private static originalError = console.error.bind(console);
    private static originalInfo = console.info.bind(console);
    private static originalDebug = console.debug.bind(console);

    static initialize(): void {
        this.patchConsole();
        
        Hooks.once("ready" as any, () => {
            this.isReady = true;
            this.startFlushTimer();
            window.addEventListener("beforeunload", () => this.flushSync());
        });
    }

    private static patchConsole(): void {
        const methods = ['log', 'warn', 'error', 'info', 'debug'] as const;
        
        methods.forEach(method => {
            (console as any)[method] = (...args: any[]) => {
                // If it's one of Foundry's upload messages, we must ignore it to prevent loops
                // But we let it pass through to the real console ONLY if it's NOT the upload message
                // However, the user wants "no output itself". The upload message IS output from this utility's action.
                // So we suppress it from BOTH the log file AND the browser console.
                
                const isUploadMessage = args.some(arg => 
                    typeof arg === "string" && (
                        arg.includes("You have uploaded files into a module or system folder") || 
                        arg.includes(`${this.FILE_NAME} saved to`)
                    )
                );

                if (isUploadMessage) {
                    return; // Suppress completely
                }

                // Capture for file
                this.addEntry(method.toUpperCase(), ...args);

                // Pass to original console
                switch (method) {
                    case 'log': this.originalLog(...args); break;
                    case 'warn': this.originalWarn(...args); break;
                    case 'error': this.originalError(...args); break;
                    case 'info': this.originalInfo(...args); break;
                    case 'debug': this.originalDebug(...args); break;
                }
            };
        });
    }

    private static addEntry(level: string, ...args: any[]): void {
        // Filter CSS styling
        const content = args.filter(arg => typeof arg !== "string" || !/^(color:|font-|background)/.test(arg.trim()))
                            .map(arg => this.formatArg(arg))
                            .join(" ");

        if (!content) return;
        
        // Simple format: [LEVEL] Message
        this.buffer.push(`[${level.padEnd(5)}] ${content}`);
    }

    private static formatArg(arg: any): string {
        if (arg === undefined) return "undefined";
        if (arg === null) return "null";
        if (arg instanceof Error) return `${arg.message}\n${arg.stack || ""}`;
        if (typeof arg === "object") {
            try { return JSON.stringify(arg); } // Compact JSON (no indentation) to save space
            catch { return String(arg); }
        }
        return String(arg);
    }

    private static startFlushTimer(): void {
        this.flushInterval = window.setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
    }

    private static async flush(): Promise<void> {
        if (this.buffer.length === 0 || this.isFlushing || !this.isReady) return;

        this.isFlushing = true;
        
        try {
            this.fullLog += this.buffer.join("\n") + "\n";
            this.buffer = [];

            const file = new File([this.fullLog], this.FILE_NAME, { type: "text/plain" });
            const FP = (foundry as any).applications.apps.FilePicker.implementation;

            // We don't need to monkey-patch here anymore because our MAIN patch (above)
            // already filters out the upload messages from both the log file AND the browser console.
            // When FilePicker calls console.warn/info, it hits our patched method, sees the string, and returns early.
            
            await FP.upload("data", this.UPLOAD_PATH, file, {}, { notify: false });
        } catch (err) {
            this.originalError("[ConsoleCapture] Flush failed:", err);
        } finally {
            this.isFlushing = false;
        }
    }

    private static flushSync(): void {
        if (this.buffer.length === 0) return;
        
        try {
            this.fullLog += this.buffer.join("\n") + "\n";
            this.buffer = [];

            const formData = new FormData();
            const file = new File([this.fullLog], this.FILE_NAME, { type: "text/plain" });
            formData.append("source", "data");
            formData.append("target", this.UPLOAD_PATH);
            formData.append("upload", file, this.FILE_NAME);

            navigator.sendBeacon("/upload", formData);
        } catch { /* best effort */ }
    }
}
