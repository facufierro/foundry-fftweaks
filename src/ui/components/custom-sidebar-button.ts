namespace FFT {
    /**
     * A reusable class for adding custom buttons to Foundry VTT sidebars
     */
    export class CustomSidebarButton {
    name: string;
    icon: string;
    tooltip: string;
    sidebar: 'left' | 'right';
    order: number;
    onClick: () => void;
    
    /**
     * @param options Configuration options for the button
     * @param options.name Unique identifier for the button
     * @param options.icon Font Awesome icon class (e.g., 'fa-mountain')
     * @param options.tooltip Tooltip text shown on hover
     * @param options.sidebar Which sidebar to add the button to ('left' or 'right')
     * @param options.order Position of the button in the sidebar (e.g., 8 for 8th position counting from top)
     * @param options.onClick Function to call when the button is clicked
     */
    constructor(options: {
        name: string;
        icon: string;
        tooltip: string;
        sidebar?: 'left' | 'right';
        order?: number;
        onClick: () => void;
    }) {
        this.name = options.name;
        this.icon = options.icon.startsWith('fa-') ? options.icon : `fa-${options.icon}`;
        this.tooltip = options.tooltip;
        this.sidebar = options.sidebar || 'left';
        this.order = options.order || 100; // Default to end
        this.onClick = options.onClick;
        
        // Register hooks to add the button when UI is rendered
        this.registerHooks();
    }
    
    /**
     * Register the necessary hooks to add the button to the UI
     */
    private registerHooks(): void {
        // The left sidebar contains the scene controls
        if (this.sidebar === 'left') {
            Hooks.on("renderSceneControls", this.onRenderLeftSidebar.bind(this));
        } 
        // The right sidebar contains players, chat, etc.
        else {
            Hooks.on("renderSidebar", this.onRenderRightSidebar.bind(this));
        }
    }
    
    /**
     * Callback when the left sidebar (scene controls) is rendered
     */
    private onRenderLeftSidebar(_app, _html): void {
        const buttonSelector = `#scene-controls-layers button[data-control='${this.name}']`;
        const button = document.querySelector(buttonSelector);
        
        if (!button) {
            const layersElement = document.querySelector("#scene-controls-layers");
            if (layersElement) {
                const buttonHtml = `<li style="order: ${this.order}">
                    <button type="button" class="control ui-control layer icon fas ${this.icon}" 
                            role="tab" data-action="${this.name}" 
                            data-control="${this.name}" 
                            data-tooltip="${this.tooltip}" 
                            aria-controls="scene-controls-tools"></button>
                </li>`;
                
                layersElement.insertAdjacentHTML("beforeend", buttonHtml);
                
                const newButton = document.querySelector(buttonSelector);
                if (newButton) {
                    newButton.addEventListener("click", this.onClick);
                }
            }
        }
    }
    
    /**
     * Callback when the right sidebar is rendered
     */
    private onRenderRightSidebar(_app, html): void {
        const sidebarNav = html.find(".sidebar-tabs");
        const buttonSelector = `.sidebar-tab[data-tab='${this.name}']`;
        
        if (!sidebarNav.find(buttonSelector).length) {
            const buttonHtml = `<a class="item sidebar-tab" data-tab="${this.name}" style="order: ${this.order}">
                <i class="fas ${this.icon}"></i>
                <span class="tooltip">${this.tooltip}</span>
            </a>`;
            
            sidebarNav.append(buttonHtml);
            sidebarNav.find(buttonSelector).click(this.onClick);
        }
    }
}
}
