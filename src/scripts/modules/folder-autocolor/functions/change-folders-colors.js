export function changeFoldersColors() {
    if (!game.user.isGM) return; // Only proceed if the user is the GM
    let colors = [
        '#4b0000',
        '#003300',
        '#00004b',
        '#4b004b',
        '#4b2e00',
        '#00334b',
        '#4b0033',
        '#333333',
        '#4b4b00',
        '#4b6600'
    ];

    // Function to lighten a hex color by a given percentage
    function lightenColor(color, lightenPercent) {
        let num = parseInt(color.slice(1), 16),
            amt = Math.round(2.55 * lightenPercent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;

        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    // Function to apply folder color updates
    function updateFolderColors() {
        // Define an array of all relevant sidebar tab IDs, including the Compendiums tab
        let tabIds = ["actors", "items", "scenes", "journal", "cards", "rolltable", "playlists", "compendium"];

        // Iterate over each tab to apply the folder color updates
        tabIds.forEach(tabId => {
            // Get the corresponding DOM element for the tab
            let tabElement = document.querySelector(`#${tabId}`);

            if (tabElement) {
                // Find all root folder elements (data-folder-depth="1")
                let rootFolders = tabElement.querySelectorAll('.directory-item.folder[data-folder-depth="1"]');

                // Create a dictionary to store the folder tree structure { rootFolderId: [subfolderIds] }
                let folderTree = {};

                // Iterate over each root folder element and gather its subfolders
                rootFolders.forEach((folderElement, index) => {
                    // Get the root folder ID from the DOM element
                    let rootFolderId = folderElement.getAttribute('data-folder-id');
                    folderTree[rootFolderId] = [];

                    // Set color based on index and rotate through the colors list
                    let rootColor = colors[index % colors.length];
                    let lightColor1 = lightenColor(rootColor, 10);
                    let lightColor2 = lightenColor(rootColor, 20);

                    // Now find all subfolders that belong to this root folder
                    let currentDepth = 1;
                    let subfolders = folderElement.querySelectorAll(`.directory-item.folder[data-folder-depth="${currentDepth + 1}"]`);
                    while (subfolders.length > 0) {
                        subfolders.forEach(subfolderElement => {
                            let subfolderId = subfolderElement.getAttribute('data-folder-id');
                            folderTree[rootFolderId].push(subfolderId);
                        });
                        currentDepth += 1;
                        subfolders = folderElement.querySelectorAll(`.directory-item.folder[data-folder-depth="${currentDepth}"]`);
                    }

                    // Update the color of the root folder
                    let rootFolder = game.folders.get(rootFolderId);
                    rootFolder.update({ color: rootColor });

                    // Alternate subfolder colors between the root color and the lighter version
                    folderTree[rootFolderId].forEach((subfolderId, subIndex) => {
                        let subfolder = game.folders.get(subfolderId);
                        let subfolderColor = (subIndex % 2 === 0) ? lightColor1 : lightColor2;
                        subfolder.update({ color: subfolderColor });
                    });
                });
            }
        });
    }

    // Wait a small delay before applying colors to ensure DOM is fully loaded
    setTimeout(updateFolderColors, 25);
}