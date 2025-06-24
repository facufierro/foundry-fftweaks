/**
 * Heal selected tokens by 1 HP
 */
async function heal1Selected(): Promise<void> {
    await healTokens(1);
}
