namespace FFT {
    /**
     * A UI class for the Battlemap Generator panel
     */
    class BattlemapGeneratorUI extends FormApplication {
        initialized: boolean;
        
        constructor(options = {}) {
            super(options);
            // Initialize UI state properties here
            this.initialized = false;
        }
        
        static get defaultOptions() {
            return {
                ...super.defaultOptions,
                title: "Battlemap Generator",
                id: "battlemap-generator-ui",
                template: "modules/fftweaks/templates/battlemap-generator.hbs",
                width: 300,
                resizable: true,
            };
        }
        
        getData() {
            return {
                // Return data for the UI template
            };
        }
        
        activateListeners(html) {
            super.activateListeners(html);
            
            // Set up event listeners for UI elements
            html.on("click", ".generate-button", this._onGenerateMap.bind(this));
            
            this.initialized = true;
        }
        
        _onGenerateMap(event) {
            ui.notifications.info("Generating battlemap...");
            // Implement battlemap generation logic here
        }
        
        async _updateObject(event, formData) {
            // Required implementation for FormApplication
            console.log("Form data submitted:", formData);
            // Process form data here
        }
        
        close() {
            this.initialized = false;
            return super.close();
        }
    }

    /**
     * Battlemap Generator Module
     */
    export class BattlemapGeneratorModule {
        static ui: BattlemapGeneratorUI | null = null;
        static button: CustomSidebarButton | null = null;
    
        static initialize() {
            // Create a custom sidebar button using our reusable class
            BattlemapGeneratorModule.button = new CustomSidebarButton({
                name: 'battlemap-generator',
                icon: 'fa-mountain',
                tooltip: 'Battlemap Generator',
                sidebar: 'left',
                order: 8, // Make this the 8th button in the sidebar (counting from top)
                onClick: () => BattlemapGeneratorModule.onGenerateBattlemap()
            });
        }

        /**
         * Handle the generate battlemap button click
         */
        static onGenerateBattlemap() {
            // Open the UI panel
            if (!BattlemapGeneratorModule.ui) {
                BattlemapGeneratorModule.ui = new BattlemapGeneratorUI();
            }
            BattlemapGeneratorModule.ui.render(true);
            
            ui.notifications.info("Battlemap Generator activated");
            console.log("Battlemap generator UI opened");
        }
    }
}