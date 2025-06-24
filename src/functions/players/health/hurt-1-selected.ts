/**
 * Hurt selected tokens by 1 HP
 */
async function hurt1Selected(): Promise<void> {
    await hurtTokens(1);
}
