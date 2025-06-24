export interface ButtonConfig {
    id: string;
    title: string;
    icon: string;
    row: number;
    onClick: (event: Event) => void;
}

export interface KeyBindings {
    default: string;
    shift?: string;
    ctrl?: string;
    alt?: string;
    rightClick?: string;
}

export interface RawButtonData {
    name: string;
    icon: string;
    row: number;
    script?: string; // Legacy support
    keyBindings?: KeyBindings; // New key binding system
}

export type RawButtonMap = Record<string, RawButtonData>;

export interface FunctionBarOptions {
    id?: string;
    position?: { top: string; left: string };
    buttons: ButtonConfig[];
}
