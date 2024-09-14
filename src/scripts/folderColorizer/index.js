export function initialize() {
    // List of colors to be used. Add as many colors as you like here.
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
    // Example: Three colors to alternate

    // Define an array of all relevant sidebar tab IDs, including the Compendiums tab
    let tabIds = ["actors", "items", "scenes", "journal", "cards", "tables", "playlists", "compendium"];

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
                let color = colors[index % colors.length];

                // Now find all subfolders that belong to this root folder
                let currentDepth = 1;
                let subfolders = folderElement.querySelectorAll(`.directory-item.folder[data-folder-depth="${currentDepth + 1}"]`);
                while (subfolders.length > 0) {
                    subfolders.forEach(subfolderElement => {
                        let subfolderId = subfolderElement.getAttribute('data-folder-id');
                        folderTree[rootFolderId].push(subfolderId); // Store subfolder ID in the folder tree
                    });
                    currentDepth += 1;
                    subfolders = folderElement.querySelectorAll(`.directory-item.folder[data-folder-depth="${currentDepth}"]`);
                }

                // Update the color of the root folder
                let rootFolder = game.folders.get(rootFolderId);
                rootFolder.update({ color: color });

                // Update the color of all subfolders belonging to this root
                folderTree[rootFolderId].forEach(subfolderId => {
                    let subfolder = game.folders.get(subfolderId);
                    subfolder.update({ color: color });
                });
            });
        }
    });
}