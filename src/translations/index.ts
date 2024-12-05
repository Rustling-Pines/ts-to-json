export const locales = ["en-us", "fr", "de", 'es'] as const;
export type Locales = typeof locales[number];

export const translations = [
    { key: 'name', value: 'start' },
    { key: 'name', value: 'peepu' },
    { key: 'name', value: 'betty' },
    { key: 'name', value: 'jarry' },
    { key: 'name', value: 'camey' },
    { key: 'name', value: '-end' },
];