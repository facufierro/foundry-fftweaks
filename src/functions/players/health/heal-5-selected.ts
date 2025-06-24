/**
 * Heal selected tokens by 5 HP
 */
async function heal5Selected(): Promise<void> {
    await healTokens(5);
}
