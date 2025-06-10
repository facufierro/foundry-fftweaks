export interface ButtonConfig {
    id: string;
    title: string;
    icon: string;
    row: number;
    onClick: (event: Event) => void;
}

export interface RawButtonData {
    name: string;
    icon: string;
    script: string;
    row: number;
}

export type RawButtonMap = Record<string, RawButtonData>;

export interface FunctionBarOptions {
    id?: string;
    position?: { top: string; left: string };
    buttons: ButtonConfig[];
}
