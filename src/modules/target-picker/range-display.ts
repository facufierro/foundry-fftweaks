namespace FFT {
    /**
     * Range Display Functions for Target Picker
     * Handles 3D range rings and range finders
     */
    export class RangeDisplay {
        private static isTargetPicker = false;
        private static rangeRings = {
            normal: null as any,
            long: null as any
        };

        /**
         * Clear existing range rings
         */
        static clearRanges(force = false) {
            if (!(game as any).Levels3DPreview?._active) return;
            if (this.isTargetPicker && !force) return;
            
            if (this.rangeRings.normal) {
                this.rangeRings.normal.remove();
                this.rangeRings.normal = null;
            }
            if (this.rangeRings.long) {
                this.rangeRings.long.remove();
                this.rangeRings.long = null;
            }
        }

        /**
         * Show range rings around a token
         */
        static showRangeRings(normal: number, long: number, object: any, tokenSizeOffset = 0) {
            if (!(game as any).Levels3DPreview?._active) return;
            
            this.clearRanges(true);
            this.isTargetPicker = true;
            
            const RangeRingEffect = (game as any).Levels3DPreview.CONFIG.entityClass.RangeRingEffect;
            
            if (normal) {
                this.rangeRings.normal = new RangeRingEffect(
                    object, 
                    normal + tokenSizeOffset
                );
            }
            if (long) {
                this.rangeRings.long = new RangeRingEffect(
                    object, 
                    long + tokenSizeOffset, 
                    "#ff0000"
                );
            }
        }

        /**
         * Show range finder to all visible tokens
         */
        static async showRangeFinder(range: number, object: any) {
            if (!(game as any).Levels3DPreview?._active || !range) return;
            
            const levels3d = (game as any).Levels3DPreview;
            const RangeFinder = levels3d.CONFIG.entityClass.RangeFinder;
            
            // Clear existing range finders
            levels3d.rangeFinders.forEach((rf: any) => {
                rf.destroy();
            });
            
            const visTokens = canvas.tokens?.placeables.filter(t => t.visible) || [];
            
            for (let t of visTokens) {
                const dist = levels3d.helpers.ruler3d.measureMinTokenDistance(
                    levels3d.tokens[object.id],
                    levels3d.tokens[t.id]
                );
                const distDiff = range - dist;
                
                if (distDiff >= 0) {
                    new RangeFinder(t, { sources: [object], text: "" });
                } else {
                    new RangeFinder(t, {
                        sources: [object],
                        text: `-${Math.abs(Number(distDiff.toFixed(2)))}${canvas.scene?.grid.units || ""}`,
                        style: {
                            color: 'rgb(210 119 119);',
                        }
                    });
                }
            }
        }

        /**
         * Clear all range finders
         */
        static clearRangeFinders() {
            if (!(game as any).Levels3DPreview?._active) return;
            (game as any).Levels3DPreview.rangeFinders.forEach((rf: any) => { rf.destroy(); });
            this.isTargetPicker = false;
        }

        /**
         * Check if Levels 3D Preview is available for range display
         */
        static isRangeDisplayAvailable(): boolean {
            return !!(game as any).Levels3DPreview?._active;
        }
    }
}
