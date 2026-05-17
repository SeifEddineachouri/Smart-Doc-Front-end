export type LanguageCode = 'en' | 'fr' | 'ar';

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['en', 'fr', 'ar'];

export function isLanguageCode(language: string | null | undefined): language is LanguageCode {
	return typeof language === 'string' && SUPPORTED_LANGUAGES.includes(language as LanguageCode);
}

export function normalizeLanguageCode(language: string | null | undefined): LanguageCode {
	return isLanguageCode(language) ? language : 'en';
}
