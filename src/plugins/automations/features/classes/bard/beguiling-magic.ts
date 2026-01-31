import { Functions } from "../../../../../functions";

export function beguilingMagic() {
    (Hooks as any).on("dnd5e.useItem", (item: any) => {
        console.log("FFTweaks | Hook dnd5e.useItem fired", item);
        Functions.beguilingMagic(item);
    });

    (Hooks as any).on("dnd5e.postUseActivity", (activity: any, usageConfig: any, results: any) => {
        console.log("FFTweaks | Hook dnd5e.postUseActivity fired", activity);
        // In dnd5e v3, activity.item is the item
        if (activity?.item) {
            Functions.beguilingMagic(activity.item);
        }
    });
}
