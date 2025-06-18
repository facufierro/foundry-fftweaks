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

                console.log(`StatsGenerator: Processing ${actor.name} - Base CR: ${template.baseCR}, Target CR: ${targetCR}, Type: ${template.type}, Multiplier: ${multiplier.toFixed(2)}`);

                const updates: any = {};

                // Update abilities with randomization
                if (template.stats.abilities) {
                    updates["system.abilities"] = {};
                    for (const [ability, value] of Object.entries(template.stats.abilities)) {
                        if (value !== undefined) {
                            // Add randomization: ±1 from base value
                            const randomVariation = Math.floor(Math.random() * 3) - 1; // -1 to +1
                            const baseWithVariation = value + randomVariation;
                            // Very conservative scaling for abilities - max +/-3 from base
                            const scaledValue = Math.max(8, Math.min(18, Math.round(baseWithVariation + (multiplier - 1) * 2)));
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

                // AC is handled automatically by FoundryVTT based on equipped armor + DEX modifier
                // Don't set AC manually - let it calculate naturally

                // Update HP with conservative scaling
                if (template.stats.hp) {
                    if (template.stats.hp.average) {
                        // Add ±20% randomization to HP
                        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
                        const baseHPWithVariation = Math.round(template.stats.hp.average * randomFactor);
                        // More conservative HP scaling - only scale by a small amount
                        const scaledHP = Math.max(1, Math.round(baseHPWithVariation * Math.pow(multiplier, 0.5)));
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

                // Update CR - ensuring proper format for FoundryVTT D&D 5e
                updates["system.details.cr"] = targetCR;
                console.log(`StatsGenerator: Setting CR to ${targetCR} for ${actor.name}`);
                
                // Also update XP value based on CR (FoundryVTT calculates this automatically but we'll set it)
                const xpTable: Record<number, number> = {
                    0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
                    1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
                    6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
                    11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
                    16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000
                };
                const xpValue = xpTable[targetCR] || Math.round(targetCR * 200);
                updates["system.details.xp.value"] = xpValue;
                console.log(`StatsGenerator: Setting XP to ${xpValue} for CR ${targetCR}`);

                // Apply all updates
                console.log(`StatsGenerator: Applying updates to ${actor.name}:`, updates);
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
