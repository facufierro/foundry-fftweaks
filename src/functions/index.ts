import { healTokens } from "./characters/health/heal-tokens";
import { hurtTokens } from "./characters/health/hurt-tokens";
import { addTokensToCombat } from "./combat/add-tokens-to-combat";
import { removeTokensFromCombat } from "./combat/remove-tokens-from-combat";
import { resetCombatEncounter } from "./combat/reset-combat-encounter";
import { deleteCombatEncounter } from "./combat/delete-combat-encounter";
import { distributeGold } from "./loot/distribute-gold";
import { distributeExperience } from "./loot/distribute-experience";
import { lootCorpses } from "./loot/loot-all";
import { replaceCompendiumItems } from "./utilities/replace-compendium-items";
import { updateSpellLists } from "./utilities/update-spell-lists";

export class Functions {
    static healTokens = healTokens;
    static hurtTokens = hurtTokens;
    static addTokensToCombat = addTokensToCombat;
    static removeTokensFromCombat = removeTokensFromCombat;
    static resetCombatEncounter = resetCombatEncounter;
    static deleteCombatEncounter = deleteCombatEncounter;
    static distributeGold = distributeGold;
    static distributeExperience = distributeExperience;
    static lootCorpses = lootCorpses;
    static replaceCompendiumItems = replaceCompendiumItems;
    static updateSpellLists = updateSpellLists;
}
