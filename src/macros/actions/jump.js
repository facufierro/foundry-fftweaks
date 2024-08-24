
const token = canvas.tokens.controlled[0];
const strValue = token.actor.system.abilities.str.value
const strMod = token.actor.system.abilities.str.mod;
const dexMod = token.actor.system.abilities.dex.mod;
const rollFormulaAthletics = `1d20 + ${strMod}`;
const rollFormulaAcrobatics = `1d20 + ${dexMod}`;

if (canvas.tokens.controlled.length === 1) {
    Roll.create(rollFormulaAthletics).evaluate({ async: true }).then(athleticsRoll => {
        athleticsRoll.toMessage({ flavor: "Athletics Check for Jump" });

        jumpStrMod = Math.ceil(strValue / 5);
        if (jumpStrMod < 2) jumpStrMod = 2;

        if (athleticsRoll.total < 10) jumpStrMod = 1;
        jumpDistance = jumpStrMod * canvas.grid.size;

        angle = canvas.tokens.controlled[0].document.rotation;
        xTargetPosition = 0;
        yTargetPosition = 0;
        switch (angle) {
            //south
            case 0: {
                xTargetPosition = xTargetPosition;
                yTargetPosition = yTargetPosition + jumpDistance;
                break;
            }
            //southwest
            case 45: {
                xTargetPosition = xTargetPosition - jumpDistance;
                yTargetPosition = yTargetPosition + jumpDistance;
                break;
            }
            //west
            case 90: {
                xTargetPosition = xTargetPosition - jumpDistance;
                yTargetPosition = yTargetPosition;
                break;
            }
            //northwest
            case 135: {
                xTargetPosition = xTargetPosition - jumpDistance;
                yTargetPosition = yTargetPosition - jumpDistance;
                break;
            }
            //north
            case 180: {
                xTargetPosition = xTargetPosition;
                yTargetPosition = yTargetPosition - jumpDistance;
                break;
            }
            //northeast
            case 225: {
                xTargetPosition = xTargetPosition + jumpDistance;
                yTargetPosition = yTargetPosition - jumpDistance;
                break;
            }
            //east
            case 270: {
                xTargetPosition = xTargetPosition + jumpDistance;
                yTargetPosition = yTargetPosition;
                break;
            }
            //southeast
            case 315: {
                xTargetPosition = xTargetPosition + jumpDistance;
                yTargetPosition = yTargetPosition + jumpDistance;
                break;
            }
        }

        let xNewPosition = token.x + xTargetPosition
        let yNewPosition = token.y + yTargetPosition
        token.document.update({ x: xNewPosition, y: yNewPosition })

        Roll.create(rollFormulaAcrobatics).evaluate({ async: true }).then(acrobaticsRoll => {
            acrobaticsRoll.toMessage({ flavor: "Acrobatics Check for Landing" });
            // if (acrobaticsRoll.total < 10) {
            //     // Apply prone effect; adjust according to your game system
            //     const effectData = {
            //         label: "Prone",
            //         icon: "icons/svg/falling.svg",
            //         changes: [
            //             {
            //                 key: "data.conditions.prone",
            //                 mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            //                 value: true,
            //             },
            //         ],
            //     };
            //     token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            // }
        })
    })

}

