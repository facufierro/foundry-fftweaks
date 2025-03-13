namespace FFT {
    export class FolderAutoColor {
        static initialize(): void {
            FolderAutoColor.updateFolderColors();
            Hooks.on("createFolder", (folder: Folder, data: any) => {
                FolderAutoColor.updateFolderColors();
            });
        }
        static updateFolderColors(): void {
            if (!game.user.isGM) return;

            let colors: string[] = [
                '#4b0000', '#003300', '#00004b', '#4b004b', '#4b2e00',
                '#00334b', '#4b0033', '#333333', '#4b4b00', '#4b6600'
            ];

            // Function to lighten a hex color by a given percentage
            function lightenColor(color: string, lightenPercent: number): string {
                let num = parseInt(color.slice(1), 16),
                    amt = Math.round(2.55 * lightenPercent),
                    R = (num >> 16) + amt,
                    G = (num >> 8 & 0x00FF) + amt,
                    B = (num & 0x0000FF) + amt;

                return '#' + (
                    0x1000000 +
                    (Math.min(255, Math.max(0, R)) * 0x10000) +
                    (Math.min(255, Math.max(0, G)) * 0x100) +
                    (Math.min(255, Math.max(0, B)))
                ).toString(16).slice(1);
            }

            // Function to apply folder color updates
            function updateFolderColors(): void {
                let tabIds: string[] = ["actors", "items", "scenes", "journal", "cards", "rolltable", "playlists", "compendium"];

                tabIds.forEach(tabId => {
                    let tabElement = document.querySelector(`#${tabId}`);

                    if (tabElement) {
                        let rootFolders = tabElement.querySelectorAll<HTMLDivElement>('.directory-item.folder[data-folder-depth="1"]');
                        let folderTree: Record<string, string[]> = {};

                        rootFolders.forEach((folderElement, index) => {
                            let rootFolderId = folderElement.getAttribute('data-folder-id');
                            if (!rootFolderId) return;
                            folderTree[rootFolderId] = [];

                            let rootColor = colors[index % colors.length];
                            let lightColor1 = lightenColor(rootColor, 10);
                            let lightColor2 = lightenColor(rootColor, 20);

                            let currentDepth = 1;
                            let subfolders = folderElement.querySelectorAll<HTMLDivElement>(`.directory-item.folder[data-folder-depth="${currentDepth + 1}"]`);
                            while (subfolders.length > 0) {
                                subfolders.forEach(subfolderElement => {
                                    let subfolderId = subfolderElement.getAttribute('data-folder-id');
                                    if (subfolderId) folderTree[rootFolderId].push(subfolderId);
                                });
                                currentDepth += 1;
                                subfolders = folderElement.querySelectorAll<HTMLDivElement>(`.directory-item.folder[data-folder-depth="${currentDepth}"]`);
                            }

                            let rootFolder = game.folders.get(rootFolderId);
                            rootFolder?.update({ color: rootColor });

                            folderTree[rootFolderId].forEach((subfolderId, subIndex) => {
                                let subfolder = game.folders.get(subfolderId);
                                let subfolderColor = (subIndex % 2 === 0) ? lightColor1 : lightColor2;
                                subfolder?.update({ color: subfolderColor });
                            });
                        });
                    }
                });
            }

            setTimeout(updateFolderColors, 25);
        }
    }
}
