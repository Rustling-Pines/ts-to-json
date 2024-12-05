import { ITranslations } from "../types/ITranslations";

export const locales = ['en-us', 'fr', 'de'] as const;
export type Locales = typeof locales[number];

export const translations: ITranslations<Locales>[] = [
    { key: 'WELCOME-LABEL', 'en-us': 'Welcome', fr: 'Bienvenue', de: 'Willkommen' },
    { key: 'GOODBYE-LABEL', 'en-us': 'Goodbye', fr: 'Au revoir', de: 'Verabschiedung' },
    
    // ❌ Missing 'de' will trigger a TypeScript error
    // { key: 'Goodbye', 'en-us': 'Goodbye', fr: 'Au revoir' },
];