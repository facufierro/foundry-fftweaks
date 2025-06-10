namespace FFT {
    export class ButtonDataService {
        static async loadButtons(): Promise<Array<{
            id: string;
            title: string;
            icon: string;
            row: number;
            onClick: (event: Event) => void;
        }>> {
            const response = await fetch("modules/fftweaks/src/modules/function-bar/data/button-data.json");

            if (!response.ok) {
                console.error("Failed to fetch button data:", response.statusText);
                return [];
            }

            const raw: Record<string, { name: string; icon: string; script: string; row: number }> = await response.json();

            return Object.entries(raw).map(([id, { name, icon, script, row }]) => ({
                id,
                title: name,
                icon,
                row,
                onClick: FFT.ButtonDataService.resolveFunction(script)
            }));
        }

        static resolveFunction(scriptPath: string): (event: Event) => void {
            const parts = scriptPath.split(".");
            let fn: any = window;
            for (const part of parts) {
                fn = fn?.[part];
            }

            if (typeof fn === "function") return fn;
            console.error(`Invalid script path: ${scriptPath}`);
            return () => { };
        }
    }
}
