namespace FFT {
    export class TargetPickerModule {
        private static isProcessingTargets = false;
        private static isRestartingActivity = false;
        private static deferredDialog: any = null;

        static initialize() {
            // Register module setting for tutorial guide
            (game.settings as any).register("fftweaks", "targetPickerGuideShown", {
                name: "Target Picker Guide Shown",
                hint: "Whether the target picker tutorial has been shown to the user",
                scope: "client",
                config: false,
                type: Boolean,
                default: false
            });

            console.log("[FFT Target Picker] Initializing click interception...");

            // Wait for ready to set up click handlers
            Hooks.once("ready", () => {
                this.setupClickInterception();
            });

            // Hook to prevent ActivityUsageDialog from rendering during target selection
            Hooks.on("renderActivityUsageDialog", this.handleActivityUsageDialogRender.bind(this));

            // Keep fallback hooks
            Hooks.on("dnd5e.preUseItem", this.handleItemUsage.bind(this));
            Hooks.on("dnd5e.preUseActivity", this.handleActivityUsage.bind(this));

            console.log("[FFT Target Picker] Target picker module initialized with click interception");
        }

        /**
         * Handle item usage and trigger target picker if needed
         */
        static async handleItemUsage(item: any, config: any, options: any) {
            // Prevent infinite loops when we restart the item
            if (this.isProcessingTargets) {
                console.log("[FFT Target Picker] Already processing targets, allowing item to continue");
                return true;
            }

            console.log("[FFT Target Picker] Item usage detected:", {
                itemName: item.name,
                itemType: item.type,
                target: item.system?.target,
                range: item.system?.range,
                activities: item.system?.activities,
                config,
                options
            });

            // Check if the item or any of its activities need targeting
            let needsTargeting = false;
            let targetInfo = null;

            // First check the item itself
            if (item.system?.target?.type && item.system.target.type !== "self") {
                targetInfo = this.getTargetInfo(item);
                needsTargeting = targetInfo.needsTargeting;
            }

            // If item doesn't need targeting, check its activities
            if (!needsTargeting && item.system?.activities) {
                for (const [id, activity] of Object.entries(item.system.activities)) {
                    const activityTargetInfo = this.getActivityTargetInfo(activity);
                    if (activityTargetInfo.needsTargeting) {
                        needsTargeting = true;
                        targetInfo = activityTargetInfo;
                        break;
                    }
                }
            }

            if (!needsTargeting) {
                console.log("[FFT Target Picker] No targeting needed for this item or its activities");
                return true; // Continue with normal usage
            }

            const actor = item.actor;
            const token = actor?.getActiveTokens()?.[0];

            console.log("[FFT Target Picker] Actor and token:", {
                actor: actor?.name,
                token: token?.name,
                hasToken: !!token
            });

            if (!token) {
                ui.notifications.warn("No token found for this actor");
                return false; // Cancel usage
            }

            console.log("[FFT Target Picker] Target info:", targetInfo);

            // Immediately set processing flag to block all related hooks
            this.isProcessingTargets = true;
            console.log("[FFT Target Picker] Set processing flag, blocking item");

            // Clear existing targets before picking new ones
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            console.log("[FFT Target Picker] Starting target selection for item...");

            // Defer target selection to next tick to ensure the item is fully blocked
            setTimeout(async () => {
                const success = await FFT.TargetPicker.pickTargets(
                    token,
                    targetInfo.count,
                    targetInfo.ranges,
                    { showRangeDisplay: true }
                );

                if (success && game.user?.targets.size >= targetInfo.count) {
                    console.log("[FFT Target Picker] Target selection successful, restarting item");
                    // Set restart flag to allow the item to proceed normally
                    this.isRestartingActivity = true;

                    // Restart the item with targets selected
                    try {
                        await item.use(config, options);
                    } catch (error) {
                        console.error("[FFT Target Picker] Error restarting item:", error);
                        ui.notifications.error("Failed to restart item after target selection");
                    }

                    this.isRestartingActivity = false;
                } else {
                    console.log("[FFT Target Picker] Target selection failed or cancelled");
                    ui.notifications.info("Target selection cancelled or insufficient targets");
                }

                this.isProcessingTargets = false;
                console.log("[FFT Target Picker] Cleared processing flag");
            }, 10);

            // Always return false to prevent the original item from continuing
            return false;
        }

        /**
         * Handle activity usage (for newer D&D 5e system versions)
         */
        static async handleActivityUsage(activity: any, config: any, options: any) {
            // Prevent infinite loops when we restart the activity
            if (this.isProcessingTargets && this.isRestartingActivity) {
                console.log("[FFT Target Picker] Already processing targets, allowing activity to continue");
                return true;
            }

            // If we're processing targets but not restarting, block the activity
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking activity - target selection in progress");
                return false;
            }

            console.log("[FFT Target Picker] Activity usage detected:", {
                activityName: activity.name,
                activityType: activity.type,
                target: activity.target,
                range: activity.range,
                item: activity.item?.name,
                config,
                options
            });

            // Check if this activity needs targeting
            const targetInfo = this.getActivityTargetInfo(activity);
            console.log("[FFT Target Picker] Activity target info:", targetInfo);

            if (!targetInfo.needsTargeting) {
                console.log("[FFT Target Picker] Activity target info says no targeting needed");
                return true;
            }

            const item = activity.item;
            const actor = item.actor;
            const token = actor?.getActiveTokens()?.[0];

            console.log("[FFT Target Picker] Activity actor and token:", {
                actor: actor?.name,
                token: token?.name,
                hasToken: !!token
            });

            if (!token) {
                ui.notifications.warn("No token found for this actor");
                return false;
            }

            // Immediately set processing flag to block all related hooks
            this.isProcessingTargets = true;
            console.log("[FFT Target Picker] Set processing flag, blocking activity");

            // Clear existing targets before picking new ones
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            console.log("[FFT Target Picker] Starting target selection...");

            // Defer target selection to next tick to ensure the activity is fully blocked
            setTimeout(async () => {
                const success = await FFT.TargetPicker.pickTargets(
                    token,
                    targetInfo.count,
                    targetInfo.ranges,
                    { showRangeDisplay: true }
                );

                if (success && game.user?.targets.size >= targetInfo.count) {
                    console.log("[FFT Target Picker] Target selection successful, restarting activity");
                    // Set restart flag to allow the activity to proceed normally
                    this.isRestartingActivity = true;

                    // Show deferred dialog if one was captured
                    if (this.deferredDialog) {
                        console.log("[FFT Target Picker] Showing deferred dialog after target selection");
                        const deferredDialog = this.deferredDialog;
                        this.deferredDialog = null; // Clear it
                        
                        // Re-render the dialog
                        try {
                            const newDialog = new Dialog(deferredDialog.data);
                            newDialog.render(true);
                        } catch (error) {
                            console.error("[FFT Target Picker] Error showing deferred dialog:", error);
                            // Fallback: proceed without the dialog
                            await activity.use(config, options);
                        }
                    } else {
                        // No deferred dialog, restart normally
                        try {
                            await activity.use(config, options);
                        } catch (error) {
                            console.error("[FFT Target Picker] Error restarting activity:", error);
                            ui.notifications.error("Failed to restart activity after target selection");
                        }
                    }

                    this.isRestartingActivity = false;
                } else {
                    console.log("[FFT Target Picker] Target selection failed or cancelled");
                    ui.notifications.info("Target selection cancelled or insufficient targets");
                    
                    // Clear any deferred dialog on cancellation
                    this.deferredDialog = null;
                }

                this.isProcessingTargets = false;
                console.log("[FFT Target Picker] Cleared processing flag");
            }, 10);

            // Always return false to prevent the original activity from continuing
            return false;
        }

        /**
         * Handle pre-roll attack to prevent attacks while targeting
         */
        static handlePreRollAttack(item: any, config: any) {
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking attack roll during target selection");
                return false;
            }
            return true;
        }

        /**
         * Handle pre-roll damage to prevent damage while targeting
         */
        static handlePreRollDamage(item: any, config: any) {
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking damage roll during target selection");
                return false;
            }
            return true;
        }        /**
         * Handle activity consumption to prevent resource consumption while targeting
         */
        static handleActivityConsumption(activity: any, usage: any) {
            console.log("[FFT Target Picker] Activity consumption called:", {
                activityName: activity.name,
                activityType: activity.type,
                isProcessingTargets: this.isProcessingTargets,
                isRestartingActivity: this.isRestartingActivity,
                usage
            });

            // If we're already processing targets and restarting, allow consumption
            if (this.isProcessingTargets && this.isRestartingActivity) {
                console.log("[FFT Target Picker] Allowing consumption during restart");
                return true;
            }

            // If we're processing targets but not restarting, block consumption
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking activity consumption during target selection");
                return false;
            }

            // Check if this activity needs targeting - if so, block consumption and start targeting
            const targetInfo = this.getActivityTargetInfo(activity);
            if (targetInfo.needsTargeting) {
                console.log("[FFT Target Picker] Activity needs targeting, blocking consumption and starting target selection");
                
                const item = activity.item;
                const actor = item?.actor;
                const token = actor?.getActiveTokens()?.[0];
                
                if (!token) {
                    console.log("[FFT Target Picker] No token found, allowing consumption to proceed normally");
                    return true;
                }

                // Set processing flag immediately to block this and subsequent consumption calls
                this.isProcessingTargets = true;
                
                // Clear existing targets
                game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

                // Start target selection after a short delay
                setTimeout(async () => {
                    const success = await FFT.TargetPicker.pickTargets(
                        token,
                        targetInfo.count,
                        targetInfo.ranges,
                        { showRangeDisplay: true }
                    );

                    if (success && game.user?.targets.size >= targetInfo.count) {
                        console.log("[FFT Target Picker] Target selection successful, restarting activity from consumption hook");
                        
                        this.isRestartingActivity = true;
                        
                        try {
                            await activity.use();
                        } catch (error) {
                            console.error("[FFT Target Picker] Error restarting activity from consumption hook:", error);
                        }
                        
                        this.isRestartingActivity = false;
                    } else {
                        console.log("[FFT Target Picker] Target selection cancelled from consumption hook");
                        ui.notifications.info("Target selection cancelled");
                    }
                    
                    this.isProcessingTargets = false;
                }, 10);

                // Block the current consumption
                return false;
            }

            // Activity doesn't need targeting, allow normal consumption
            return true;
        }

        /**
         * Handle pre-item usage consumption to catch spell slot dialogs before they appear
         */
        static handlePreItemUsageConsumption(item: any, config: any, options: any, usage: any) {
            console.log("[FFT Target Picker] Pre-item usage consumption called:", {
                itemName: item.name,
                itemType: item.type,
                isProcessingTargets: this.isProcessingTargets,
                isRestartingActivity: this.isRestartingActivity,
                config,
                options,
                usage
            });

            // If we're already processing targets and restarting, allow consumption
            if (this.isProcessingTargets && this.isRestartingActivity) {
                console.log("[FFT Target Picker] Allowing pre-item consumption during restart");
                return true;
            }

            // If we're processing targets but not restarting, block consumption
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking pre-item consumption during target selection");
                return false;
            }

            // Check if this item needs targeting
            let needsTargeting = false;
            let targetInfo = null;

            // Check the item itself
            if (item.system?.target?.type && item.system.target.type !== "self") {
                targetInfo = this.getTargetInfo(item);
                needsTargeting = targetInfo.needsTargeting;
            }

            // Check its activities
            if (!needsTargeting && item.system?.activities) {
                for (const [id, activity] of Object.entries(item.system.activities)) {
                    const activityTargetInfo = this.getActivityTargetInfo(activity);
                    if (activityTargetInfo.needsTargeting) {
                        needsTargeting = true;
                        targetInfo = activityTargetInfo;
                        break;
                    }
                }
            }

            if (needsTargeting) {
                console.log("[FFT Target Picker] Item needs targeting, blocking pre-consumption and starting target selection");
                
                const actor = item.actor;
                const token = actor?.getActiveTokens()?.[0];
                
                if (!token) {
                    console.log("[FFT Target Picker] No token found, allowing pre-consumption to proceed normally");
                    return true;
                }

                // Set processing flag immediately
                this.isProcessingTargets = true;
                
                // Clear existing targets
                game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

                // Start target selection
                setTimeout(async () => {
                    const success = await FFT.TargetPicker.pickTargets(
                        token,
                        targetInfo.count,
                        targetInfo.ranges,
                        { showRangeDisplay: true }
                    );

                    if (success && game.user?.targets.size >= targetInfo.count) {
                        console.log("[FFT Target Picker] Target selection successful, restarting item from pre-consumption hook");
                        
                        this.isRestartingActivity = true;
                        
                        try {
                            await item.use(config, options);
                        } catch (error) {
                            console.error("[FFT Target Picker] Error restarting item from pre-consumption hook:", error);
                        }
                        
                        this.isRestartingActivity = false;
                    } else {
                        console.log("[FFT Target Picker] Target selection cancelled from pre-consumption hook");
                        ui.notifications.info("Target selection cancelled");
                    }
                    
                    this.isProcessingTargets = false;
                }, 10);

                // Block the current consumption
                return false;
            }

            // Item doesn't need targeting, allow normal consumption
            return true;
        }

        /**
         * Extract targeting information from an item
         */
        static getTargetInfo(item: any) {
            const target = item.system?.target || {};
            const range = item.system?.range || {};

            console.log("[FFT Target Picker] Analyzing item target data:", {
                targetType: target.type,
                targetValue: target.value,
                rangeValue: range.value,
                rangeLong: range.long,
                fullTarget: target,
                fullRange: range
            });

            let needsTargeting = false;
            let count = 1;
            let ranges: any = {};

            // Determine if we need manual targeting
            switch (target.type) {
                case "creature":
                case "enemy":
                case "ally":
                    needsTargeting = true;
                    count = target.value || 1;
                    break;
                case "radius":
                case "sphere":
                case "cylinder":
                case "cone":
                case "line":
                case "cube":
                    // Area effects typically need a point target
                    needsTargeting = true;
                    count = 1;
                    break;
            }

            // Add range information if available
            if (range.value && range.value > 0) {
                ranges.normal = range.value;
                if (range.long && range.long > range.value) {
                    ranges.long = range.long;
                }
            }

            const result = { needsTargeting, count, ranges };
            console.log("[FFT Target Picker] Item target analysis result:", result);
            return result;
        }

        /**
         * Extract targeting information from an activity
         */
        static getActivityTargetInfo(activity: any) {
            const target = activity.target || {};
            const range = activity.range || {};

            console.log("[FFT Target Picker] Analyzing activity target data:", {
                activityType: activity.type,
                targetType: target.type,
                targetCount: target.count,
                rangeValue: range.value,
                rangeLong: range.long,
                fullTarget: target,
                fullRange: range
            });

            let needsTargeting = false;
            let count = 1;
            let ranges: any = {};

            // Check various activity types that need targeting
            switch (activity.type) {
                case "attack":
                    // All attacks need targeting unless explicitly self
                    needsTargeting = target.type !== "self";
                    count = 1;
                    break;

                case "damage":
                    // Damage activities typically need targeting
                    needsTargeting = target.type !== "self";
                    count = target.count || 1;
                    break;

                case "heal":
                    // Healing can target self or others
                    needsTargeting = target.type !== "self";
                    count = target.count || 1;
                    break;

                case "utility":
                case "save":
                case "check":
                    // Check target type for utility activities
                    needsTargeting = target.type && target.type !== "self";
                    count = target.count || 1;
                    break;

                default:
                    // For unknown activity types, check target type
                    switch (target.type) {
                        case "creature":
                        case "enemy":
                        case "ally":
                            needsTargeting = true;
                            count = target.count || 1;
                            break;
                        case "radius":
                        case "sphere":
                        case "cylinder":
                        case "cone":
                        case "line":
                        case "cube":
                            // Area effects typically need a point target
                            needsTargeting = true;
                            count = 1;
                            break;
                        case "self":
                            needsTargeting = false;
                            break;
                        default:
                            // If no specific target type but has a range, likely needs targeting
                            if (range.value && range.value > 0) {
                                needsTargeting = true;
                                count = 1;
                            }
                            break;
                    }
                    break;
            }

            // Add range information if available
            if (range.value && range.value > 0) {
                ranges.normal = range.value;
                if (range.long && range.long > range.value) {
                    ranges.long = range.long;
                }
            }

            const result = { needsTargeting, count, ranges };
            console.log("[FFT Target Picker] Activity target analysis result:", result);
            return result;
        }

        /**
         * Handle dialog rendering to intercept resource consumption dialogs
         */
        static handleDialogRender(dialog: any, html: JQuery) {
            // Skip if we're not processing targets or if we're already handling a dialog
            if (!this.isProcessingTargets || this.isRestartingActivity) {
                return;
            }

            console.log("[FFT Target Picker] Dialog rendered during target selection:", {
                title: dialog.data?.title,
                content: dialog.data?.content,
                buttons: Object.keys(dialog.data?.buttons || {}),
                isProcessingTargets: this.isProcessingTargets
            });

            // Check if this looks like a resource consumption dialog
            const title = dialog.data?.title?.toLowerCase() || "";
            const content = dialog.data?.content?.toLowerCase() || "";
            
            const isResourceDialog = 
                title.includes("spell slot") ||
                title.includes("resource") ||
                title.includes("consume") ||
                title.includes("usage") ||
                content.includes("spell slot") ||
                content.includes("resource") ||
                content.includes("consume");

            if (isResourceDialog) {
                console.log("[FFT Target Picker] Detected resource consumption dialog, auto-closing and deferring");
                
                // Close the dialog immediately
                dialog.close();
                
                // Store the dialog data for later use
                this.deferredDialog = {
                    dialog: dialog,
                    html: html,
                    data: dialog.data
                };
                
                return false; // Prevent the dialog from showing
            }
        }

        /**
         * Handle application rendering to catch other types of dialogs
         */
        static handleApplicationRender(app: any, html: JQuery) {
            // Skip if we're not processing targets
            if (!this.isProcessingTargets || this.isRestartingActivity) {
                return;
            }

            // Check for various dialog types that might appear
            const appClass = app.constructor.name;
            const isDialogLike = appClass.includes("Dialog") || 
                               appClass.includes("Form") || 
                               app.element?.hasClass("dialog");

            if (isDialogLike) {
                console.log("[FFT Target Picker] Application dialog rendered during target selection:", {
                    class: appClass,
                    title: app.title,
                    isProcessingTargets: this.isProcessingTargets
                });

                // For now, just log it - we can add specific handling if needed
            }
        }

        /**
         * Setup click interception for various UI elements
         */
        static setupClickInterception() {
            console.log("[FFT Target Picker] Setting up click handlers...");

            // Intercept clicks on character sheets, hotbars, and other UI elements
            this.interceptElementClicks();

            // Also hook into actor sheet rendering to add handlers to new sheets
            Hooks.on("renderActorSheet", (sheet: any, html: JQuery) => {
                this.addClickHandlersToSheet(html);
            });

            // Hook into hotbar rendering
            Hooks.on("renderHotbar", (hotbar: any, html: JQuery) => {
                this.addClickHandlersToHotbar(html);
            });

            console.log("[FFT Target Picker] Click interception setup complete");
        }

        /**
         * Intercept clicks on existing UI elements
         */
        static interceptElementClicks() {
            // Get all existing actor sheets
            Object.values(ui.windows).forEach((app: any) => {
                if (app.constructor.name.includes("ActorSheet") && app.element) {
                    this.addClickHandlersToSheet(app.element);
                }
            });

            // Get hotbar
            if (ui.hotbar?.element) {
                this.addClickHandlersToHotbar(ui.hotbar.element);
            }

            // Intercept any existing item buttons on the page
            const itemButtons = document.querySelectorAll('[data-item-id], .item, .spell, .feature, .attack');
            itemButtons.forEach(button => {
                this.addClickHandlerToElement(button as HTMLElement);
            });
        }

        /**
         * Add click handlers to an actor sheet
         */
        static addClickHandlersToSheet(html: JQuery) {
            // Look for item-related buttons and links
            const itemSelectors = [
                '[data-item-id]',
                '.item .item-name',
                '.item .item-image', 
                '.spell .spell-name',
                '.feature .feature-name',
                '.attack .attack-name',
                '.item-use',
                '.spell-use',
                '.rollable[data-item-id]'
            ];

            itemSelectors.forEach(selector => {
                html.find(selector).each((index: number, element: HTMLElement) => {
                    this.addClickHandlerToElement(element);
                });
            });
        }

        /**
         * Add click handlers to hotbar
         */
        static addClickHandlersToHotbar(html: JQuery) {
            // Look for macro buttons that might trigger items
            html.find('.macro').each((index: number, element: HTMLElement) => {
                this.addClickHandlerToElement(element);
            });
        }

        /**
         * Add click handler to a specific element
         */
        static addClickHandlerToElement(element: HTMLElement) {
            // Avoid adding multiple handlers
            if (element.dataset.fftTargetPickerHandler) return;
            element.dataset.fftTargetPickerHandler = "true";

            element.addEventListener('click', (event) => {
                this.handleElementClick(event, element);
            }, true); // Use capture phase to intercept before other handlers
        }

        /**
         * Handle click on an element that might trigger an item
         */
        static async handleElementClick(event: Event, element: HTMLElement) {
            // Skip if we're already processing
            if (this.isProcessingTargets) return;

            console.log("[FFT Target Picker] Click intercepted:", {
                element: element.tagName,
                classes: element.className,
                dataset: element.dataset
            });

            // Try to find the item from the clicked element
            const item = this.getItemFromElement(element);
            if (!item) return;

            console.log("[FFT Target Picker] Found item from click:", item.name);

            // Check if this item needs targeting
            const needsTargeting = this.checkItemNeedsTargeting(item);
            if (!needsTargeting) {
                console.log("[FFT Target Picker] Item doesn't need targeting, allowing normal click");
                return;
            }

            console.log("[FFT Target Picker] Item needs targeting, intercepting click");

            // Prevent the original click from proceeding
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Get the actor and token
            const actor = item.actor;
            const token = actor?.getActiveTokens()?.[0];
            
            if (!token) {
                ui.notifications.warn("No token found for this actor");
                return;
            }

            // Start target selection
            this.isProcessingTargets = true;
            game.user?.targets.forEach(t => t.setTarget(false, { releaseOthers: true }));

            const targetInfo = this.getItemTargetingInfo(item);

            const success = await FFT.TargetPicker.pickTargets(
                token,
                targetInfo.count,
                targetInfo.ranges,
                { showRangeDisplay: true }
            );

            if (success && game.user?.targets.size >= targetInfo.count) {
                console.log("[FFT Target Picker] Target selection successful, triggering original item action");
                
                // Allow the item to proceed normally
                this.isRestartingActivity = true;
                
                try {
                    // Trigger the original item action
                    await item.use();
                } catch (error) {
                    console.error("[FFT Target Picker] Error using item after target selection:", error);
                } finally {
                    this.isRestartingActivity = false;
                    this.isProcessingTargets = false;
                }
            } else {
                console.log("[FFT Target Picker] Target selection cancelled");
                ui.notifications.info("Target selection cancelled");
                this.isProcessingTargets = false;
            }
        }

        /**
         * Get item from a clicked element
         */
        static getItemFromElement(element: HTMLElement): any {
            // Try to get item ID from data attributes
            let itemId = element.dataset.itemId || element.dataset.item;
            
            // If not found, look in parent elements
            if (!itemId) {
                let parent = element.parentElement;
                while (parent && !itemId) {
                    itemId = parent.dataset.itemId || parent.dataset.item;
                    parent = parent.parentElement;
                }
            }

            if (!itemId) return null;

            // Try to find the actor from the sheet
            const sheet = element.closest('.window-content')?.closest('.window-app');
            if (!sheet) return null;

            // Get the actor from the sheet
            const actorId = (sheet as any).dataset?.appid;
            if (!actorId) return null;

            const app = ui.windows[parseInt(actorId)] as any;
            if (!app?.actor) return null;

            // Get the item from the actor
            return app.actor.items.get(itemId);
        }

        /**
         * Check if an item needs targeting by examining its properties and activities
         */
        static checkItemNeedsTargeting(item: any): boolean {
            // Check item-level targeting
            if (item.system?.target?.type && item.system.target.type !== "self") {
                const targetInfo = this.getTargetInfo(item);
                if (targetInfo.needsTargeting) return true;
            }

            // Check activity-level targeting
            if (item.system?.activities) {
                for (const [id, activity] of Object.entries(item.system.activities)) {
                    const activityTargetInfo = this.getActivityTargetInfo(activity);
                    if (activityTargetInfo.needsTargeting) return true;
                }
            }

            return false;
        }

        /**
         * Get comprehensive targeting info for an item
         */
        static getItemTargetingInfo(item: any) {
            // First try item-level targeting
            if (item.system?.target?.type && item.system.target.type !== "self") {
                const targetInfo = this.getTargetInfo(item);
                if (targetInfo.needsTargeting) return targetInfo;
            }

            // Then try activity-level targeting
            if (item.system?.activities) {
                for (const [id, activity] of Object.entries(item.system.activities)) {
                    const activityTargetInfo = this.getActivityTargetInfo(activity);
                    if (activityTargetInfo.needsTargeting) return activityTargetInfo;
                }
            }

            // Fallback
            return { needsTargeting: false, count: 1, ranges: {} };
        }

        /**
         * Handle ActivityUsageDialog rendering to prevent it during target selection
         */
        static handleActivityUsageDialogRender(dialog: any, html: JQuery) {
            console.log("[FFT Target Picker] ActivityUsageDialog render intercepted:", {
                isProcessingTargets: this.isProcessingTargets,
                isRestartingActivity: this.isRestartingActivity,
                dialogId: dialog.id
            });

            // If we're processing targets but not in restart mode, prevent the dialog
            if (this.isProcessingTargets && !this.isRestartingActivity) {
                console.log("[FFT Target Picker] Blocking ActivityUsageDialog during target selection");
                
                // Close the dialog immediately
                setTimeout(() => {
                    dialog.close();
                }, 1);
                
                // Return false to try to prevent rendering
                return false;
            }

            // Allow normal rendering if we're not blocking
            return true;
        }
    }
}
