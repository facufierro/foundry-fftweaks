// Augment Foundry VTT types with missing properties

declare global {
    interface Actor {
        hasPlayerOwner: boolean;
        flags: any;
        ownership: Record<string, number>;
        img: string;
        system: any; // Allow any access to system properties
    }

    interface Token {
        actor: Actor | null;
    }

    interface Combat {
        started: boolean;
    }

    interface Item {
        system: any; // Allow any access to system properties
    }
}

declare namespace foundry {
    namespace utils {
        function getProperty(object: any, key: string): any;
        function setProperty(object: any, key: string, value: any): boolean;
    }
}

export {};
