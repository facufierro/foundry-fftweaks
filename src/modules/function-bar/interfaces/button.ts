export interface Button {
    id: string;
    title: string;
    icon: string;
    row: number;
    onClick: (event: Event) => void;
}
