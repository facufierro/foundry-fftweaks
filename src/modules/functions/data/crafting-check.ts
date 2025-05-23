// (window as any).FFT.Functions.craftingCheck = async function (actor, toolID, checksNeeded, DC) {
//     // Ensure the necessary flags are initialized
//     actor.flags["custom-dnd5e"] = actor.flags["custom-dnd5e"] || {};
//     actor.flags["custom-dnd5e"]["crafting-progress"] = actor.flags["custom-dnd5e"]["crafting-progress"] || { value: 0, max: 0 };
//     actor.flags["custom-dnd5e"]["crafting-failures"] = actor.flags["custom-dnd5e"]["crafting-failures"] || { value: 0, max: 3 };

//     // Set the crafting progress max to the required checks
//     await actor.update({ "flags.custom-dnd5e.crafting-progress.max": checksNeeded });

//     // Make the tool check roll
//     const result = await actor.rollToolCheck(toolID);

//     if (result.total >= DC) {
//         // Successful check: Deduct downtime hours and increase progress
//         const downtimeHours = actor.getFlag("custom-dnd5e", "downtime-hours") || 0;
//         await actor.update({
//             "flags.custom-dnd5e.downtime-hours": downtimeHours - 2,
//             "flags.custom-dnd5e.crafting-progress.value": actor.getFlag("custom-dnd5e", "crafting-progress.value") + 1,
//         });

//         // Check if crafting progress has reached the maximum
//         const craftingProgress = actor.getFlag("custom-dnd5e", "crafting-progress.value") || 0;
//         const craftingMax = actor.getFlag("custom-dnd5e", "crafting-progress.max") || 0;
//         if (craftingProgress >= craftingMax) {
//             await actor.update({
//                 "flags.custom-dnd5e.crafting-progress.value": 0,
//                 "flags.custom-dnd5e.crafting-progress.max": 0,
//                 "flags.custom-dnd5e.crafting-failures.value": 0,
//             });
//             return { success: true, consume: true };
//         }
//     } else {
//         // Failed check: Increase crafting failures
//         await actor.update({
//             "flags.custom-dnd5e.crafting-failures.value": actor.getFlag("custom-dnd5e", "crafting-failures.value") + 1,
//         });

//         // Check if crafting failures have reached the maximum
//         const craftingFailures = actor.getFlag("custom-dnd5e", "crafting-failures.value") || 0;
//         const craftingFailuresMax = actor.getFlag("custom-dnd5e", "crafting-failures.max") || 3;
//         if (craftingFailures >= craftingFailuresMax) {
//             await actor.update({
//                 "flags.custom-dnd5e.crafting-progress.value": 0,
//                 "flags.custom-dnd5e.crafting-progress.max": 0,
//                 "flags.custom-dnd5e.crafting-failures.value": 0,
//             });
//             return { success: false, consume: true };
//         }
//     }

//     // If no crafting completion or failure, return false for both success and consume
//     return { success: false, consume: false };
// };
