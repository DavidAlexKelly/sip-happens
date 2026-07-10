// src/styles/theme.ts
// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — "Sip Happens" · Jackbox-style overhaul
//
// Direction: a Jackbox party-game stage. Deep indigo backdrop, loud saturated
// accents, and one signature system used everywhere: solid "sticker" surfaces
// with a thick ink border and a HARD offset shadow (no blur). Buttons press
// down onto their own shadow. Hero elements get a one-degree tilt.
//
// All original export names and Colors keys are preserved so any file not
// touched by the redesign keeps compiling.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // The stage
  background: '#221A5E',            // deep indigo stage
  surfaceContainerLow: '#2A2170',   // one step up
  surfaceContainer: '#322880',      // panels
  surfaceContainerHigh: '#3B3092',  // raised panels
  surfaceContainerHighest: '#4438A4',
  surfaceBright: '#4F42B8',

  // Hero action — buzzer yellow
  primary: '#FFCC26',
  primaryContainer: '#FFB300',      // pressed / gradient tail
  primaryDim: '#FFE07A',
  onPrimary: '#1B1244',             // ink on yellow

  // Party pink — secondary energy
  secondary: '#FF4D8D',
  onSecondary: '#FFFFFF',

  // Cyan — cool accent
  tertiary: '#3EE6E0',
  onTertiary: '#0D3534',

  // Text
  onSurface: '#FFF8EC',             // chalk white
  onSurfaceVariant: '#BDB6E8',      // muted lavender
  onBackground: '#FFF8EC',

  outline: '#8C85C4',
  outlineVariant: '#453A9E',

  error: '#FF5470',
  errorContainer: '#4A0E2A',

  // ── New Jackbox tokens ──
  ink: '#160F3E',                   // borders, hard shadows, text on brights
  paper: '#FFF8EC',                 // the prompt-card face
  paperDim: '#F0E8D8',
} as const;

// The sticker system: one set of numbers, used by every surface.
export const Jack = {
  border: 3,        // ink border width
  shadow: 5,        // hard shadow offset (buttons drop onto this)
  shadowBig: 7,     // hero panels
  radius: 16,
  radiusBig: 22,
  tiltL: '-1.2deg', // signature tilts — use sparingly
  tiltR: '1.2deg',
} as const;

// Distinct, collision-friendly avatar/player palette — reads on indigo.
export const PlayerColors = [
  '#FFCC26', // buzzer yellow
  '#FF4D8D', // party pink
  '#3EE6E0', // cyan
  '#8C6BFF', // grape
  '#B6F44A', // lime
  '#FF7A3C', // orange
  '#5EB8FF', // sky
  '#FFF8EC', // chalk
];

export const PlayerRanks = [
  'Legend', 'Pro Level', 'Challenger', 'Newbie',
  'Wildcard', 'Icon', 'Rookie', 'Phantom',
];

// Keyed by Challenge.mode — matches backendPools in src/data/gameData.ts.
export const ModeColors: Record<string, string> = {
  drink:  '#3EE6E0', // cyan — refreshing
  dare:   '#FF7A3C', // orange
  truth:  '#8C6BFF', // grape
  chaos:  '#FFCC26', // yellow
  spicy:  '#FF4D8D', // pink-red
  custom: '#5EB8FF', // sky — user-made
  other:  '#5EB8FF', // custom-card catch-all category
};

export const ModeLabels: Record<string, string> = {
  drink:  'Drink',
  dare:   'Dare',
  truth:  'Truth',
  chaos:  'Chaos',
  spicy:  'Spicy 🌶️',
  custom: 'Your Deck',
  other:  'Other',
};

// Typography roles — same bundled families, no new packages.
export const Type = {
  display: 'PlusJakartaSans_800ExtraBold',
  displayItalic: 'PlusJakartaSans_800ExtraBold_Italic',
  bodyBold: 'BeVietnamPro_700Bold',
  bodyMedium: 'BeVietnamPro_500Medium',
  body: 'BeVietnamPro_400Regular',
} as const;
