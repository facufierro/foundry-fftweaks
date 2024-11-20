(window as any).FFT.Functions.craftingCheck = async function (actor, toolID: string, checks: number, DC: number) {
    const max_failures = 3;
    const gold = actor.system.currency.gp;
    const downtimeHours = actor.system.currency.dd;
    let failures = 0;
    let successes = 0;
    ui.notifications.info(`You have ${downtimeHours} downtime hours remaining.`);


};
