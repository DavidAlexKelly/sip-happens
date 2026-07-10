// src/branding.ts
// Single source of truth for the app name and reused copy — never hard-code
// "Sip Happens" elsewhere, import from here so it can't drift again.

export const APP_NAME = 'Sip Happens';
export const APP_TAGLINE = 'Pick a deck, pass the phone, see who cracks first.';
export const SUPPORT_EMAIL = 'support@siphappens.app'; // update to your real inbox
export const PRIVACY_URL = 'https://siphappens.app/privacy'; // must be live before store submission
export const TERMS_URL = 'https://siphappens.app/terms'; // must be live before store submission

/**
 * The age gate confirms the LOCAL legal drinking age, not a fixed number —
 * this is a placeholder minimum (US/most-of-EU baseline). If you want a
 * per-region minimum you'll need a country picker; most drinking-game apps
 * on the stores just confirm "I am of legal drinking age in my country",
 * which is what AgeGateScreen does by default.
 */
export const MIN_AGE = 18;
