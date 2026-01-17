export async function distributeExperience(): Promise<void> {
    const controlledTokens = canvas.tokens?.controlled ?? [];
    const allSceneTokens = canvas.tokens?.placeables ?? [];

    // Filter for player tokens from selection
    const playerTokens = controlledTokens.filter(t => t.actor?.hasPlayerOwner);

    // Get all dead hostile tokens in the scene (not just selected ones)
    const hostileTokens = allSceneTokens.filter(t => {
        const actor = t.actor;
        if (!actor) return false;
        const isHostile = t.document.disposition === -1;
        const isEnemy = !actor.hasPlayerOwner;
        const hp = foundry.utils.getProperty(actor.system, "attributes.hp.value");
        const isDead = typeof hp === "number" && hp <= 0;
        return isHostile && isEnemy && isDead;
    });

    // Sanity check
    if (playerTokens.length === 0) {
        ui.notifications?.warn("No player characters selected.");
        return;
    }

    // Calculate default XP from ALL dead hostile tokens in the scene
    let defaultXP = 0;
    for (const token of hostileTokens) {
        const actor = token.actor;
        if (!actor) continue;
        const xpVal = Number(foundry.utils.getProperty(actor.system, "details.xp.value")) || 0;
        defaultXP += xpVal;
    }

    new Dialog({
        title: "Distribute XP",
        content: `
            <div style="text-align: center; margin: 10px 0;">
                <label for="xp">Enter amount of XP:</label><br>
                <input id="xp" type="number" value="${defaultXP}" style="width: 60%; text-align: center; margin-top: 5px;" placeholder="e.g. 500" />
                <div style="margin-top: 10px;">
                    <input type="checkbox" id="subtract" />
                    <label for="subtract">Subtract XP instead</label>
                </div>
            </div>
        `,
        buttons: {
            ok: {
                label: "Distribute",
                callback: async (html: JQuery<HTMLElement>) => {
                    const xpInput = html.find("#xp").val();
                    const subtractChecked = html.find("#subtract").is(":checked");

                    const inputXP = Number(xpInput);
                    if (isNaN(inputXP) || inputXP <= 0) return;

                    const isSubtraction = subtractChecked;
                    const totalXP = inputXP;
                    const numTokens = playerTokens.length;
                    const baseShare = Math.floor(totalXP / numTokens);
                    let remainder = totalXP % numTokens;

                    const shuffledTokens = playerTokens.slice().sort(() => Math.random() - 0.5);

                    const results: string[] = [];

                    for (let i = 0; i < shuffledTokens.length; i++) {
                        const token = shuffledTokens[i];
                        let actor = token.actor;
                        // For DnD5e wild shape/polymorph, use the original actor if available
                        let originalActorId: string | undefined;
                        if (actor && typeof actor.flags === 'object' && actor.flags && typeof actor.flags["dnd5e"] === 'object' && actor.flags["dnd5e"]) {
                            originalActorId = (actor.flags["dnd5e"] as any).originalActor;
                        }
                        if (originalActorId && game.actors) {
                            const originalActor = game.actors.get(originalActorId);
                
                            if (originalActor) actor = originalActor;
                        }
                        if (!actor) continue;

                        const extra = i < remainder ? 1 : 0;
                        const totalShare = baseShare + extra;

                        const currentXP = Number(foundry.utils.getProperty(actor.system, "details.xp.value") ?? 0);
                        const newXP = isSubtraction
                            ? Math.max(0, currentXP - totalShare)
                            : currentXP + totalShare;

                        const updateData: Record<string, unknown> = {};
                        foundry.utils.setProperty(updateData, "system.details.xp.value", newXP);
                        await actor.update(updateData);

                        const portrait = actor.img;

                        results.push(`
                            <li class="item flexrow">
                                <div class="dice-roll flexcol">
                                    <div class="item-row flexrow">
                                        <div class="item-name flexrow">
                                            <div class="item-image" style="background-image:url('${portrait}'); background-size: cover;"></div>
                                            <h4>${actor.name}</h4>
                                        </div>
                                        <div class="dice-total xp-result flexrow noselect">
                                            ${isSubtraction ? "-" : "+"}${totalShare} XP
                                        </div>
                                    </div>
                                </div>
                            </li>
                        `);
                    }

                    const messageContent = `
                        <div class="monks-tokenbar assignxp chat-card item-card">
                            <header class="card-header flexrow">
                                <h3 class="item-name noborder">XP Distribution</h3>
                                <div class="item-controls flexrow">
                                    <h3 class="noborder">Total: ${isSubtraction ? "-" : ""}${totalXP} XP</h3>
                                </div>
                            </header>
                            <div class="message-content" style="margin:5px 0px">
                                <div class="form-group sheet actor">
                                    <ol class="items-list inventory-list">
                                        <ol class="item-list">
                                            ${results.join("")}
                                        </ol>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    `;

                    await ChatMessage.create({
                        content: messageContent,
                        speaker: { alias: "XP Distribution" }
                    } as any);
                }
            },
            cancel: { label: "Cancel" }
        },
        default: "ok"
    }).render(true);
}