/**
 * Heal selected tokens by 10 HP
 */
async function heal10Selected(): Promise<void> {
    await healTokens(10);
}
