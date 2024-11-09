let activeDialog = null;

export function chooseItemsDialog(items, maxSelections = 1) {
    if (activeDialog) return activeDialog;

    activeDialog = new Promise(resolve => {
        const content = items.map((item, index) =>
            `<div style="margin-bottom: 8px; display: flex; align-items: center;">
                <input type="checkbox" name="item" value="${index}" id="item-${index}" style="margin-right: 10px; transform: scale(1.2);" />
                <label for="item-${index}" style="cursor: pointer; font-size: 1.1em;">${item.name}</label>
            </div>`
        ).join("");

        const dialog = new Dialog({
            title: "Choose Items",
            content: `<form style="max-height: 300px; overflow-y: auto; padding: 10px;">${content}</form>`,
            buttons: {
                choose: {
                    label: "Choose",
                    callback: (html) => {
                        const selectedIndices = Array.from(html.find("input[name='item']:checked"))
                            .map(checkbox => parseInt(checkbox.value));
                        resolve(selectedIndices.map(index => items[index]));
                        activeDialog = null;
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => {
                        resolve([]);
                        activeDialog = null;
                    }
                }
            },
            close: () => {
                resolve([]);
                activeDialog = null;
            }
        }).render(true);

        // Automatically enable/disable checkboxes based on maxSelections
        $(document).on('change', "input[name='item']", function () {
            const checkedBoxes = $("input[name='item']:checked");
            const uncheckedBoxes = $("input[name='item']:not(:checked)");

            // Disable unchecked checkboxes if maxSelections reached, otherwise enable all
            if (checkedBoxes.length >= maxSelections) {
                uncheckedBoxes.prop("disabled", true);
            } else {
                uncheckedBoxes.prop("disabled", false);
            }
        });
    });

    return activeDialog;
}
