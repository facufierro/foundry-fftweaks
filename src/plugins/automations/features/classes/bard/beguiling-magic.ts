import { Functions } from "../../../../../functions";

export function beguilingMagic() {
    (Hooks as any).on("dnd5e.useItem", (item: any) => {
        Functions.beguilingMagic(item);
    });
}
