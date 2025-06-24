/**
 * Fully heal selected tokens
 */
async function fullHealSelected(): Promise<void> {
    await healTokens(); // No parameter = full heal
}
