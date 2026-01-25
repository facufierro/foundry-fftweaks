// Augment Foundry VTT types with missing properties and methods

declare global {
    // Extend the ConfiguredDocumentClass Actor
    interface Actor {
        id: string;
        name: string;
        hasPlayerOwner: boolean;
        flags: any;
        ownership: Record<string, number>;
        img: string;
        system: any;
        items: foundry.abstract.EmbeddedCollection<Item>;
        update(data: Record<string, any>, options?: any): Promise<this | undefined>;
        createEmbeddedDocuments(embeddedName: string, data: any[], context?: any): Promise<any[]>;
    }

    // Extend Token (PlaceableObject)
    interface Token {
        id: string;
        actor: Actor | null;
        document: TokenDocument;
    }

    // Extend TokenDocument  
    interface TokenDocument {
        actor: Actor | null;
        disposition: number;
        combatant: Combatant | null;
        delete(context?: any): Promise<this | undefined>;
        toggleCombatant(): Promise<Combatant | null>;
    }

    // Extend Combat
    interface Combat {
        id: string;
        started: boolean;
        combatants: foundry.abstract.EmbeddedCollection<Combatant>;
        update(data: Record<string, any>, options?: any): Promise<this | undefined>;
        delete(context?: any): Promise<this | undefined>;
        createEmbeddedDocuments(embeddedName: string, data: any[], context?: any): Promise<any[]>;
        startCombat(): Promise<this>;
        rollInitiative(ids: string[], options?: any): Promise<this>;
    }

    // Extend Combatant
    interface Combatant {
        id: string;
        tokenId: string;
        actorId: string;
        initiative: number;
        hidden: boolean;
        name: string;
        img: string;
        defeated: boolean;
        update(data: Record<string, any>, options?: any): Promise<this | undefined>;
        delete(context?: any): Promise<this | undefined>;
    }

    // Extend Item
    interface Item {
        id: string;
        name: string;
        img: string;
        type: string;
        system: any;
    }

    // Extend User
    interface User {
        isGM: boolean;
        role: number;
        color: string | Color;
    }

    // ChatMessage extensions
    interface ChatMessage {
        create(data: any, options?: any): Promise<ChatMessage | undefined>;
    }

    // ChatSpeaker
    interface ChatSpeaker {
        scene?: string;
        actor?: string;
        token?: string;
        alias?: string;
    }
}

export {};
