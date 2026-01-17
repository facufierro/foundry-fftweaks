import { healTokens } from "./chracters/health/heal-tokens";
import { hurtTokens } from "./chracters/health/hurt-tokens";
import { addTokensToCombat } from "./combat/add-tokens-to-combat";
import { removeTokensFromCombat } from "./combat/remove-tokens-from-combat";
import { resetCombatEncounter } from "./combat/reset-combat-encounter";
import { deleteCombatEncounter } from "./combat/delete-combat-encounter";

export class Functions {
    static healTokens = healTokens;
    static hurtTokens = hurtTokens;
    static addTokensToCombat = addTokensToCombat;
    static removeTokensFromCombat = removeTokensFromCombat;
    static resetCombatEncounter = resetCombatEncounter;
    static deleteCombatEncounter = deleteCombatEncounter;
}
