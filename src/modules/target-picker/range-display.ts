namespace FFT {
    export class RangeDisplay {
        private static isTargetPicker = false;
        private static rangeRings = {
            normal: null as any,
            long: null as any
        };

        /**
         * Clears all range rings if Levels3DPreview is active.
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
         * Shows range rings for normal and long ranges.
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
         * Shows range finders for all visible tokens.
         */
        static async showRangeFinder(range: number, object: any) {
            if (!(game as any).Levels3DPreview?._active || !range) return;

            const levels3d = (game as any).Levels3DPreview;
            const RangeFinder = levels3d.CONFIG.entityClass.RangeFinder;

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
         * Clears all range finders.
         */
        static clearRangeFinders() {
            if (!(game as any).Levels3DPreview?._active) return;
            (game as any).Levels3DPreview.rangeFinders.forEach((rf: any) => { rf.destroy(); });
            this.isTargetPicker = false;
        }

        /**
         * Checks if range display is available.
         */
        static isRangeDisplayAvailable(): boolean {
            return !!(game as any).Levels3DPreview?._active;
        }
    }
}
