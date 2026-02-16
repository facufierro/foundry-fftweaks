/**
 * ConsoleCapture - Intercepts all browser console output and persists it
 * to a console.txt file in the Foundry Data root via FilePicker API.
 * 
 * The log file resets on each page reload (matching Foundry's native console behavior).
 * Uses .txt extension since Foundry blocks .log uploads.
 */
export class ConsoleCapture {
    private static buffer: string[] = [];
    private static flushInterval: number | null = null;
    private static isReady = false;
    private static isFlushing = false;
    private static fullLog = "";

    private static readonly FLUSH_INTERVAL_MS = 2000;
    private static readonly UPLOAD_PATH = "modules/fftweaks";
    private static readonly FILE_NAME = "console.txt";

    // Store original console methods
    private static originalLog = console.log.bind(console);
    private static originalWarn = console.warn.bind(console);
    private static originalError = console.error.bind(console);
    private static originalInfo = console.info.bind(console);
    private static originalDebug = console.debug.bind(console);

    /**
     * Initialize console capture. Call as early as possible in the module lifecycle.
     * Starts intercepting immediately but defers file writes until Foundry is ready.
     */
    static initialize(): void {
        this.patchConsole();
        this.addEntry("INFO", "=== Console capture started ===");

        // Wait for Foundry to be fully ready before starting file writes
        Hooks.once("ready" as any, () => {
            this.isReady = true;
            this.startFlushTimer();
            this.registerUnloadHandler();
        });
    }

    /**
     * Monkey-patch all console methods to intercept output.
     */
    private static patchConsole(): void {
        console.log = (...args: any[]) => {
            this.addEntry("LOG", ...args);
            this.originalLog(...args);
        };

        console.warn = (...args: any[]) => {
            this.addEntry("WARN", ...args);
            this.originalWarn(...args);
        };

        console.error = (...args: any[]) => {
            this.addEntry("ERROR", ...args);
            this.originalError(...args);
        };

        console.info = (...args: any[]) => {
            this.addEntry("INFO", ...args);
            this.originalInfo(...args);
        };

        console.debug = (...args: any[]) => {
            this.addEntry("DEBUG", ...args);
            this.originalDebug(...args);
        };
    }

    /**
     * Format a single argument for the log file.
     */
    private static formatArg(arg: any): string {
        if (arg === undefined) return "undefined";
        if (arg === null) return "null";

        if (arg instanceof Error) {
            return `${arg.message}\n${arg.stack ?? ""}`;
        }

        if (typeof arg === "object") {
            try {
                return JSON.stringify(arg, null, 2);
            } catch {
                return String(arg);
            }
        }

        return String(arg);
    }

    /**
     * Build a timestamp string in HH:MM:SS.mmm format.
     */
    private static timestamp(): string {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        const s = String(now.getSeconds()).padStart(2, "0");
        const ms = String(now.getMilliseconds()).padStart(3, "0");
        return `${h}:${m}:${s}.${ms}`;
    }

    /**
     * Add a formatted entry to the buffer.
     */
    private static addEntry(level: string, ...args: any[]): void {
        // Filter out CSS styling arguments (come after %c in console calls)
        const filteredArgs = args.filter(arg => {
            if (typeof arg === "string" && /^(color:|font-|background)/.test(arg.trim())) {
                return false;
            }
            return true;
        });

        const message = filteredArgs.map(a => this.formatArg(a)).join(" ");
        const line = `[${this.timestamp()}] [${level.padEnd(5)}] ${message}`;
        this.buffer.push(line);
    }

    /**
     * Start the periodic flush timer.
     */
    private static startFlushTimer(): void {
        this.flushInterval = window.setInterval(() => {
            this.flush();
        }, this.FLUSH_INTERVAL_MS);
    }

    /**
     * Register a beforeunload handler for a final flush.
     */
    private static registerUnloadHandler(): void {
        window.addEventListener("beforeunload", () => {
            if (this.flushInterval !== null) {
                window.clearInterval(this.flushInterval);
            }
            this.flushSync();
        });
    }

    /**
     * Get the FilePicker class using the v13 namespaced path.
     */
    private static getFilePicker(): any {
        return (foundry as any).applications.apps.FilePicker.implementation;
    }

    /**
     * Async flush: upload the accumulated buffer to the log file.
     * Appends new entries to the full log and overwrites the file each time.
     */
    private static async flush(): Promise<void> {
        if (this.buffer.length === 0 || this.isFlushing) return;

        this.isFlushing = true;

        try {
            // Append new buffer entries to the full log
            this.fullLog += this.buffer.join("\n") + "\n";
            this.buffer = [];

            const file = new File([this.fullLog], this.FILE_NAME, { type: "text/plain" });
            const FP = this.getFilePicker();
            await FP.upload("data", this.UPLOAD_PATH, file, {}, { notify: false });
        } catch (err) {
            // Use original console to avoid infinite loop
            this.originalError("[ConsoleCapture] Failed to flush log:", err);
        } finally {
            this.isFlushing = false;
        }
    }

    /**
     * Synchronous flush using sendBeacon (best-effort for unload events).
     */
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
        } catch {
            // Best-effort, nothing more we can do during unload
        }
    }
}
