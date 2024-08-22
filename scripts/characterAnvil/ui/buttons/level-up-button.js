import { createButton } from '../ui-manager.js';
import { openCharacterAnvilDialog } from '../dialogs/character-anvil-dialog.js';

export function addLevelUpButton(html, actor) {

    if (html.find('.level-up-button').length > 0) return;

    const levelUpButton = createButton({
        classes: ['level-up-button', 'gold-button'],
        icon: 'fas fa-arrow-alt-circle-up',
        tooltip: 'Level Up',
        onClick: () => openCharacterAnvilDialog()
    });

    const xpLabel = html.find('.xp-label');
    xpLabel.before(levelUpButton);
}
