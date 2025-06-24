/**
 * Hurt selected tokens by 10 HP
 */
async function hurt10Selected(): Promise<void> {
    await hurtTokens(10);
}
