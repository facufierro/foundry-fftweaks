namespace FFT {
    export class StatsGenerator {
        static async applyStatsToActor(actor: Actor, template: CreatureTemplate): Promise<boolean> {
            if (!actor || !template.stats) {
                return false;
            }

            try {
                const targetCR = CRCalculator.getTargetCR(template.type, template.baseCR);
                const multiplier = CRCalculator.getCRMultiplier(targetCR, template.baseCR);
                const profBonus = CRCalculator.getProficiencyBonus(targetCR);

                const updates: any = {};

                // Update abilities with randomization
                if (template.stats.abilities) {
                    updates["system.abilities"] = {};
                    for (const [ability, value] of Object.entries(template.stats.abilities)) {
                        if (value !== undefined) {
                            // Add randomization: ±2 from base value
                            const randomVariation = Math.floor(Math.random() * 5) - 2; // -2 to +2
                            const baseWithVariation = value + randomVariation;
                            const scaledValue = Math.max(1, Math.min(30, CRCalculator.scaleStat(baseWithVariation, multiplier)));
                            updates[`system.abilities.${ability}.value`] = scaledValue;
                        }
                    }
                }

                // Update skills with proficiency
                if (template.stats.skills) {
                    updates["system.skills"] = {};
                    for (const [skill, proficiencyLevel] of Object.entries(template.stats.skills)) {
                        if (proficiencyLevel > 0) {
                            updates[`system.skills.${skill}.proficient`] = proficiencyLevel;
                        }
                    }
                }

                // Update saving throws
                if (template.stats.saves) {
                    for (const [save, proficiencyLevel] of Object.entries(template.stats.saves)) {
                        if (proficiencyLevel > 0) {
                            updates[`system.abilities.${save}.proficient`] = proficiencyLevel;
                        }
                    }
                }

                // Update AC with slight randomization
                if (template.stats.ac) {
                    // Add ±1 randomization to AC
                    const randomVariation = Math.floor(Math.random() * 3) - 1; // -1 to +1
                    const baseWithVariation = template.stats.ac + randomVariation;
                    const scaledAC = Math.max(10, CRCalculator.scaleStat(baseWithVariation, multiplier));
                    updates["system.attributes.ac.value"] = scaledAC;
                }

                // Update HP with randomization
                if (template.stats.hp) {
                    if (template.stats.hp.average) {
                        // Add ±20% randomization to HP
                        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
                        const randomizedHP = Math.round(template.stats.hp.average * randomFactor);
                        const scaledHP = CRCalculator.scaleStat(randomizedHP, multiplier, true);
                        updates["system.attributes.hp.value"] = scaledHP;
                        updates["system.attributes.hp.max"] = scaledHP;
                    }
                    if (template.stats.hp.formula) {
                        updates["system.attributes.hp.formula"] = template.stats.hp.formula;
                    }
                }

                // Update speed
                if (template.stats.speed) {
                    updates["system.attributes.movement"] = {};
                    for (const [speedType, value] of Object.entries(template.stats.speed)) {
                        updates[`system.attributes.movement.${speedType}`] = value;
                    }
                }

                // Update senses
                if (template.stats.senses) {
                    updates["system.attributes.senses"] = {};
                    for (const [senseType, value] of Object.entries(template.stats.senses)) {
                        updates[`system.attributes.senses.${senseType}`] = value;
                    }
                }

                // Update languages
                if (template.stats.languages) {
                    updates["system.traits.languages.value"] = template.stats.languages;
                }

                // Update damage resistances
                if (template.stats.damageResistances) {
                    updates["system.traits.dr.value"] = template.stats.damageResistances;
                }

                // Update damage immunities
                if (template.stats.damageImmunities) {
                    updates["system.traits.di.value"] = template.stats.damageImmunities;
                }

                // Update damage vulnerabilities
                if (template.stats.damageVulnerabilities) {
                    updates["system.traits.dv.value"] = template.stats.damageVulnerabilities;
                }

                // Update condition immunities
                if (template.stats.conditionImmunities) {
                    updates["system.traits.ci.value"] = template.stats.conditionImmunities;
                }

                // Update CR
                updates["system.details.cr"] = targetCR;

                // Apply all updates
                await actor.update(updates);

                console.log(`StatsGenerator: Successfully updated stats for ${actor.name} (CR: ${targetCR})`);
                return true;

            } catch (error) {
                console.error(`StatsGenerator: Error applying stats to ${actor.name}:`, error);
                return false;
            }
        }

        static async generateStats(actorName?: string): Promise<void> {
            let actor: Actor | null = null;

            if (actorName) {
                actor = game.actors?.find(a => a.name && (a.name as string).toLowerCase() === actorName.toLowerCase()) || null;
            } else {
                const selectedTokens = canvas.tokens?.controlled || [];
                if (selectedTokens.length === 1) {
                    actor = selectedTokens[0].actor;
                }
            }

            if (!actor) {
                ui.notifications?.warn("No valid actor found. Please select a token or provide an actor name.");
                return;
            }

            const templateName = actor.name ? (actor.name as string).toLowerCase().replace(/\s+/g, "-") : null;
            if (!templateName) {
                ui.notifications?.warn("Actor has no name for template lookup.");
                return;
            }

            try {
                const template = await this.loadTemplate(templateName);
                if (!template) {
                    ui.notifications?.warn(`No template found for ${templateName}`);
                    return;
                }

                const success = await this.applyStatsToActor(actor, template);
                if (success) {
                    ui.notifications?.info(`Stats applied to ${actor.name}`);
                } else {
                    ui.notifications?.warn(`Failed to apply stats to ${actor.name}`);
                }
            } catch (error) {
                console.error(`StatsGenerator: Error in generateStats:`, error);
                ui.notifications?.error(`Error generating stats: ${error}`);
            }
        }

        private static async loadTemplate(templateName: string): Promise<CreatureTemplate | null> {
            try {
                const response = await fetch(`modules/fftweaks/src/modules/creature-generator/data/${templateName}.json`);
                if (!response.ok) {
                    return null;
                }
                const template: CreatureTemplate = await response.json();
                return template;
            } catch (error) {
                console.warn(`StatsGenerator: Could not load template ${templateName}:`, error);
                return null;
            }
        }
    }
}
