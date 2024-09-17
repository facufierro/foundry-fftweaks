import { CharacterManager } from './utils/characterManager.js';
import * as characterAnvil from './characterAnvil/index.js';
import * as tokenBarExtender from './tokenBarExtender/index.js';
import * as autoTimer from './autoTimer/index.js';
import * as battlemapGenerator from './battlemapGenerator/index.js';
import * as chatAutoClean from './chatAutoClean/index.js';
import * as folderColorizer from './folderColorizer/index.js';
import * as tokenCustomizer from './tokenCustomizer/index.js';
import * as levelsHandler from './levelsHandler/index.js';

import { Character } from './models/character.js';

Hooks.once('ready', () => {

    CharacterManager.initializeAllPlayerCharacters();
    folderColorizer.initialize();
    // levelsHandler.initialize();
    // characterAnvil.initialize();
    tokenBarExtender.initialize();
    chatAutoClean.initialize();
    tokenCustomizer.initialize();
});

Hooks.on('renderActorSheet5e', (sheet, html, data) => {
    // characterAnvil.initializeUI(html, sheet.actor);
});

Hooks.on("pauseGame", (paused) => {
    autoTimer.initialize(paused);
});

Hooks.on('getSceneControlButtons', (controls) => {
    battlemapGenerator.initializeUI(controls);
});

Hooks.on('createFolder', () => {
    setTimeout(() => {
        folderColorizer.initialize();
    }, 25);
});

//////////////////////////////////////////////////////////////////////////////////////////// 
    // Constants for time and delays
    const TIME_LIMIT_MS = 10000; // 10 seconds
    const ATTACK_DELAY_MS = 100; // Delay for attack roll
    const DAMAGE_DELAY_MS = 500; // Delay for damage roll

    // Main function to handle attack and damage rolls
    function handleAttackAndDamageRoll(message, html) {
        if (isRecentAttack(message)) {
            triggerRoll(html, 'rollAttack', ATTACK_DELAY_MS, "Attack roll triggered.", () => {
                // Trigger the damage roll after the attack roll
                triggerRoll(html, 'rollDamage', DAMAGE_DELAY_MS, "Damage roll triggered.", () => {
                    // Remove the third last card after damage roll
                    removeNthLastCard(2);

                    // Check success only after everything has been processed
                    setTimeout(() => {
                        if (checkSuccess()) {
                            ui.notifications.info("Attack was successful.");
                        } else {
                            removeNthLastCard(1)

                        }
                    }, 100); // Ensure it's checked after everything, with a small delay to make sure the roll is processed
                });
            });
        } else {
            console.log("Message is not recent or not an attack.");
        }
    }

    // Check if the message is a recent attack message
    function isRecentAttack(message) {
        const currentTime = Date.now();
        return message.flags?.dnd5e?.activity?.type === "attack" && (currentTime - message.timestamp) < TIME_LIMIT_MS;
    }

    // Trigger a roll with a specified delay and log message
    function triggerRoll(html, action, delay, logMessage, callback) {
        setTimeout(() => {
            const button = html.find(`button[data-action="${action}"]`)[0];
            if (button) {
                const event = new MouseEvent('click', { bubbles: true, shiftKey: true });
                button.dispatchEvent(event);
                console.log(logMessage);
                if (callback) callback();
            } else {
                console.log(`Button for action "${action}" not found.`);
            }
        }, delay);
    }

    // Remove the nth last card from chat
    function removeNthLastCard(n) {
        const chatMessages = Array.from(ui.chat.element.find(".message"));
        if (chatMessages.length >= n) {
            chatMessages[chatMessages.length - n].remove();
            console.log(`Removed the ${n}th last chat message.`);
        } else {
            console.log(`Not enough chat messages to remove the ${n}th last.`);
        }
    }

    // Check if the second last message indicates success or failure
    function checkSuccess() {
        const chatMessages = ui.chat.element.find(".message");
        const secondLastMessage = chatMessages.eq(-2);
        const diceTotal = secondLastMessage.find("h4.dice-total");
        return diceTotal.length && !diceTotal.hasClass("failure");
    }

    // Hook into the chat message rendering
    Hooks.on('renderChatMessage', (message, html) => {
        handleAttackAndDamageRoll(message, html);
    });
