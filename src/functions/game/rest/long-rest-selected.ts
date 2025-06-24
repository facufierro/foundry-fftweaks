/**
 * Apply long rest to selected tokens
 */
async function longRestSelected(): Promise<void> {
    await restTokens(true);
}
