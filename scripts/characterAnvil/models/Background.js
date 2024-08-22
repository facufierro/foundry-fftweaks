export class Background {
    constructor(id, name, description) {
        this._id = id;
        this.name = name; // New name property
        this.description = description;

        // Parse the description to get the relevant data
        const parsedData = this.parseDescription();
        this.skills = parsedData.skills || new Set();
        this.languages = parsedData.languages || new Set();
        this.equipment = parsedData.equipment || [];
        this.currency = parsedData.currency || '';
        this.features = parsedData.features || new Set();
    }

    parseDescription() {
        return {
            skills: this.extractSkills(),
            languages: this.extractLanguages(),
            equipment: this.extractEquipment(),
            currency: this.extractCurrency(),
            features: this.extractFeatures()
        };
    }

    extractSkills() {
        const skillPattern = /<strong>Skill Proficiencies:<\/strong>\s*([^<]*)/i;
        const match = this.description.match(skillPattern);
        if (match) {
            return new Set(match[1].split(',').map(skill => skill.trim().toLowerCase()));
        }
        return new Set();
    }

    extractLanguages() {
        const languagePattern = /<strong>Languages:<\/strong>\s*([^<]*)/i;
        const match = this.description.match(languagePattern);
        if (match) {
            const languagesText = match[1].trim().toLowerCase();
            const languages = [];

            const choiceMatch = languagesText.match(/^(\d+)\s*(.*)/i);
            if (choiceMatch) {
                const numberOfChoices = parseInt(choiceMatch[1], 10);
                const otherLanguages = choiceMatch[2] ? choiceMatch[2].split(',').map(lang => lang.trim()).filter(lang => lang) : [];

                for (let i = 0; i < numberOfChoices; i++) {
                    languages.push('choice');
                }

                languages.push(...otherLanguages);
            } else {
                languagesText.split(',').map(lang => lang.trim()).filter(lang => lang).forEach(lang => languages.push(lang));
            }

            return languages;
        }

        return [];
    }

    extractEquipment() {
        const equipmentPattern = /@UUID\[([^\]]+)\]\{([^\}]+)\}(\s*x\s*(\d+))?/g;
        const equipment = [];
        let match;
        while ((match = equipmentPattern.exec(this.description)) !== null) {
            const uuid = match[1];
            const quantity = match[4] ? parseInt(match[4]) : 1;
            equipment.push({ quantity: quantity, id: uuid });
        }
        return equipment;
    }

    extractCurrency() {
        const currencyPattern = /\b(\d+\s*gp)\b/i;
        const match = this.description.match(currencyPattern);
        return match ? match[1].trim() : '';
    }

    extractFeatures() {
        const featurePattern = /<strong>Features:<\/strong>\s*@UUID\[([^\]]+)\]/i;
        const match = this.description.match(featurePattern);
        return match ? new Set([match[1].trim()]) : new Set();
    }

    getSummary() {
        return {
            _id: this._id,
            name: this.name, // Include the name in the summary
            skills: Array.from(this.skills),
            languages: Array.from(this.languages),
            equipment: this.equipment,
            currency: this.currency,
            features: Array.from(this.features)
        };
    }
}
