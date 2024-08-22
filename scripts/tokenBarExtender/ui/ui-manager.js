export function createButton(id, title, icon, row, onClick) {
    const button = document.createElement('div');
    button.id = id;
    button.title = title;
    button.innerHTML = `<i class="${icon}"></i>`;
    button.addEventListener('click', onClick);
    return button;
}

async function createButtons() {
    const buttonData = await (await fetch('modules/fftweaks/scripts/tokenBarExtender/data/button-data.json')).json();
    const tokenBar = document.getElementById('tokenbar-controls');

    // Remove existing custom rows to avoid duplicates
    document.querySelectorAll('[id^="custom-tokenbar-row"]').forEach(row => row.remove());

    const rows = {};

    // Create and store buttons by row
    for (const [id, button] of Object.entries(buttonData)) {
        if (!rows[button.row]) {
            rows[button.row] = document.createElement('div');
            rows[button.row].id = `custom-tokenbar-row-${button.row}`;
            rows[button.row].className = 'flexrow tokenbar-buttons';
        }

        // Create the button
        const newButton = createButton(id, button.name, button.icon, button.row, (event) => {
            import(button.script).then(m => m.default?.(event));
        });

        // Append the button to its corresponding row
        rows[button.row].appendChild(newButton);
    }

    // Append only non-empty rows to the token bar
    Object.values(rows).forEach(rowElement => {
        if (rowElement.children.length > 0) {
            tokenBar.appendChild(rowElement);
        }
    });
}

const addButtons = () => {
    const tokenBar = document.getElementById('tokenbar-controls');
    if (!tokenBar) return;

    // Ensure no existing 'custom-tokenbar-row' remains
    const existingRow = document.getElementById('custom-tokenbar-row');
    if (existingRow) existingRow.remove();

    // Create buttons and attach them
    createButtons();
};

export function extendTokenBar() {
    addButtons();

    const observer = new MutationObserver(() => {
        const tokenBar = document.getElementById('tokenbar-controls');
        if (tokenBar && !document.querySelector('[id^="custom-tokenbar-row"]')) {
            addButtons();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
