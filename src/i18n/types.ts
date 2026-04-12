export type Locale = 'en' | 'fr'

export type TranslationKey = keyof typeof import('./en').default

export type Translations = Record<TranslationKey, string>
