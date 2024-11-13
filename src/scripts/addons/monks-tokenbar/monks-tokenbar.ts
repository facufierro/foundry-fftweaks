namespace FFT.Addons {
    // Define the structure of each button's data
    interface ButtonData {
        name: string;
        icon: string;
        row: number;
        script: string;
    }

    export class MonksTokenbar {

        // Function to create an individual button with icon and click handler
        static createButton(id: string, title: string, icon: string, onClick: (event: Event) => void): HTMLDivElement {
            Debug.Log(`Creating button: ${title} with icon: ${icon}`);
            const button = document.createElement('div');
            button.id = id;
            button.title = title;
            button.classList.add('control-icon'); // Ensures styling matches other buttons
            button.innerHTML = `<i class="${icon}"></i>`; // Set icon class (e.g., "fas fa-dice")
            button.addEventListener('click', onClick);
            return button;
        }

        // Function to create buttons from JSON data and organize them into rows
        static async createButtons() {
            Debug.Log("Attempting to fetch button data...");
            try {
                const response = await fetch('modules/fftweaks/src/scripts/addons/monks-tokenbar/data/button-data.json');
                if (!response.ok) {
                    Debug.Error(`Failed to fetch button data: ${response.status} ${response.statusText}`);
                    return;
                }

                const buttonData: Record<string, ButtonData> = await response.json();
                Debug.Log("Button data fetched successfully:", buttonData);

                const tokenBar = document.getElementById('tokenbar-controls');
                if (!tokenBar) {
                    Debug.Error("Token bar not found! Adjust initialization timing if needed.");
                    return;
                }
                Debug.Log("Token bar found. Clearing existing custom rows...");

                // Remove existing custom rows to avoid duplicates
                document.querySelectorAll('[id^="custom-tokenbar-row"]').forEach(row => row.remove());

                const rows: { [key: string]: HTMLDivElement } = {};

                // Create and store buttons by row
                for (const [id, button] of Object.entries(buttonData)) {
                    Debug.Log(`Processing button: ${button.name} in row: ${button.row}`);
                    // Create a new row if it doesn't exist
                    if (!rows[button.row]) {
                        rows[button.row] = document.createElement('div');
                        rows[button.row].id = `custom-tokenbar-row-${button.row}`;
                        rows[button.row].className = 'flexrow tokenbar-buttons';
                        Debug.Log(`Created new row: ${button.row}`);
                    }

                    // Create the button using createButton function
                    const newButton = MonksTokenbar.createButton(id, button.name, button.icon, (event) => {
                        import(button.script).then(m => m.default?.(event));
                    });

                    // Append the button to its corresponding row
                    rows[button.row].appendChild(newButton);
                }

                // Append only non-empty rows to the token bar
                Object.values(rows).forEach(rowElement => {
                    if (rowElement.children.length > 0) {
                        tokenBar.appendChild(rowElement);
                        Debug.Success(`Appended row to token bar: ${rowElement.id}`);
                    }
                });
                Debug.Success("All rows and buttons appended to token bar.");
            } catch (error) {
                Debug.Error("Error fetching or processing button data:", error);
            }
        }

        // Function to add buttons and attach them to the token bar
        static addButtons() {
            const tokenBar = document.getElementById('tokenbar-controls');
            if (!tokenBar) {
                Debug.Error("Token bar not found in addButtons!");
                return;
            }

            Debug.Log("Adding buttons to token bar...");
            // Ensure no existing 'custom-tokenbar-row' remains
            document.querySelectorAll('[id^="custom-tokenbar-row"]').forEach(row => row.remove());

            // Create buttons and attach them
            MonksTokenbar.createButtons();
        }

        // Initialization function to set up observers and add buttons on load
        static initialize() {
            Debug.Log("Initializing MonksTokenbar...");

            // Check if tokenBar exists or wait for it
            const checkInterval = setInterval(() => {
                const tokenBar = document.getElementById('tokenbar-controls');
                if (tokenBar) {
                    clearInterval(checkInterval);
                    MonksTokenbar.addButtons();

                    // Set up MutationObserver if tokenBar is available
                    const observer = new MutationObserver(() => {
                        if (!document.querySelector('[id^="custom-tokenbar-row"]')) {
                            Debug.Log("MutationObserver triggered. Re-adding buttons.");
                            MonksTokenbar.addButtons();
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                    Debug.Log("MutationObserver set up.");
                } else {
                    Debug.Log("Waiting for token bar to become available...");
                }
            }, 100); // Adjust delay if needed
        }
    }
}
