export class AttackCard {
    constructor(html) {
        this.attackButton = html.find('button[data-action="rollAttack"]')[0];
        this.damageButton = html.find('button[data-action="rollDamage"]')[0];
        this.diceTotalElement = html.find('h4.dice-total')[0]; // Find the dice-total element
    }

    checkSuccess() {
        if (this.diceTotalElement) {
            if (this.diceTotalElement.classList.contains('success')) {
                console.log('Attack was successful.');
                return true;
            } else if (this.diceTotalElement.classList.contains('failure')) {
                console.log('Attack failed.');
                return false;
            }
        }
        console.log('No success or failure result found.');
        return null; // If the element or result is not found
    }

    clickAttackButton() {
        setTimeout(() => {
            if (this.attackButton) {
                this.attackButton.click();
            } else {
                console.log('No attack button found.');
            }
        }, 20);
    }

    clickDamageButton() {
        setTimeout(() => {
            if (this.damageButton) {
                this.damageButton.click();
            } else {
                console.log('No damage button found.');
            }
        }, 20);
    }

    static getLastCreatedCard() {
        const lastCard = ui.chat.element.children().last();
        return new AttackCard(lastCard); // Create an AttackCard from the last message
    }
}

