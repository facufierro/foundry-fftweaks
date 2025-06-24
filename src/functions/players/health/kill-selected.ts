/**
 * Kill selected tokens (set HP to 0)
 */
async function killSelected(): Promise<void> {
    await hurtTokens(); // No parameter = kill
}
