/// <reference path="./core.ts" />
/// <reference path="./range-display.ts" />

namespace FFT {
    export class ActivityInterceptor {
        private static isTargetPickerActivity: boolean = false;
        private static suppressInterceptor: boolean = false;

        static onPreUseActivity(activity: any, config: any, options: any): boolean {
            if (this.suppressInterceptor) return true;

            console.log("Activity use intercepted:", activity.name, activity.type);

            if (this.isTargetPickerActivity) {
                console.log("Target picker is already active, skipping:", activity.name);
                return true;
            }

            if (!this.shouldInterceptActivity(activity)) {
                console.log("Activity doesn't need targeting, allowing to proceed:", activity.name);
                return true;
            }

            this.isTargetPickerActivity = true;
            this.startTargetPicker(activity);
            return false;
        }

        private static shouldInterceptActivity(activity: any): boolean {
            return activity.type === "attack" ||
                (activity.target?.affects?.count && activity.target.affects.count >= 1);
        }

        private static async startTargetPicker(activity: any): Promise<void> {
            try {
                const token = this.getActorToken(activity);
                const targetCount = this.getTargetCount(activity);
                const range = this.getActivityRange(activity);
                const selection = await TargetPicker.pickTargets(token, targetCount, { normal: range });
                if (selection && typeof selection === "object") {
                    console.log("Target picking successful", selection);
                    this.suppressInterceptor = true;
                    let firstConfig = null;
                    let firstMessage = null;
                    let firstUsage = null;
                    let first = true;
                    for (const [tokenId, count] of Object.entries(selection)) {
                        const t = canvas.tokens.get(tokenId);
                        if (!t) continue;
                        for (let i = 0; i < count; i++) {
                            game.user?.targets.forEach(tok => tok.setTarget(false, { releaseOthers: true }));
                            t.setTarget(true, { releaseOthers: true });
                            if (first) {
                                const result = await activity.use();
                                if (result && typeof result === "object") {
                                    firstConfig = result;
                                    firstUsage = result.usage ?? {};
                                    firstMessage = result.message ?? {};
                                }
                                first = false;
                            } else {
                                let usedForward = false;
                                const item = activity.item;
                                if (item && item.system?.activities) {
                                    const forward = Array.from(item.system.activities.values()).find(a => (a as any).type === "forward");
                                    if (forward && typeof (forward as any).use === "function") {
                                        await (forward as any).use();
                                        usedForward = true;
                                    }
                                }
                                if (!usedForward) {
                                    const nextConfig = foundry.utils.deepClone(firstConfig);
                                    nextConfig.consume = false;
                                    await activity.use(
                                        nextConfig,
                                        { skip: true },
                                        firstMessage || {}
                                    );
                                }
                            }
                        }
                    }
                    this.suppressInterceptor = false;
                    this.resetFlag();
                } else {
                    console.log("Target picking cancelled");
                    this.resetFlag();
                }
            } catch (error) {
                console.error("Error in target picker:", error);
                this.suppressInterceptor = false;
                this.resetFlag();
            }
        }

        private static getActorToken(activity: any): any {
            return activity.actor?.token?.object || canvas.tokens?.controlled?.[0];
        }

        private static getTargetCount(activity: any): number {
            return activity.type === "attack" ? 1 : (activity.target?.affects?.count || 1);
        }

        private static getActivityRange(activity: any): number {
            return activity.range?.value || 30;
        }

        private static async executeActivity(activity: any, options: any = {}): Promise<any> {
            try {
                const result = await activity.use(
                    options.usage || {},
                    options.dialog || {},
                    options.message || {}
                );
                console.log("Activity used successfully:", result);
                this.resetFlag();
                return result;
            } catch (error) {
                console.error("Failed to use activity:", error);
                this.resetFlag();
                throw error;
            }
        }

        private static resetFlag(): void {
            this.isTargetPickerActivity = false;
        }

        static requiresTargeting(activity: any): boolean {
            console.log(activity);
            this.startTargetPicker(activity);
            return false;
        }

        static async useActivity(activity: any, options: any = {}): Promise<any> {
            return this.executeActivity(activity, options);
        }
    }
}
