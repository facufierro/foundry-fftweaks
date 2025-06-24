/**
 * Hurt selected tokens by 5 HP
 */
async function hurt5Selected(): Promise<void> {
    await hurtTokens(5);
}
