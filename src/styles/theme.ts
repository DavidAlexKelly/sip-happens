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

  // ── Shared accents ──
  // These four had no names, so they were duplicated as raw hex across the app:
  // lime appeared 14 times, orange 9, grape 8 — including inside DECK_COLORS
  // right next to tokens for the other three. Named here so there is one
  // source for each.
  lime: '#B6F44A',
  grape: '#8C6BFF',
  orange: '#FF7A3C',
  sky: '#5EB8FF',

  // ── Text sitting on the chalk-paper card faces ──
  inkMuted: '#5A5370',              // secondary text on paper
  success: '#3B7A00',               // "correct" — dark enough to read on paper
  cardRed: '#C6283C',               // hearts and diamonds, NOT the error red
  onPaperDim: '#8A82A0',            // tertiary text / quiet icons

  /** White, for text on a saturated accent fill. */
  onAccent: '#FFFFFF',
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
  Colors.primary,   // buzzer yellow
  Colors.secondary, // party pink
  Colors.tertiary,  // cyan
  Colors.grape,
  Colors.lime,
  Colors.orange,
  Colors.sky,
  Colors.paper,     // chalk
];

export const PlayerRanks = [
  'Legend', 'Pro Level', 'Challenger', 'Newbie',
  'Wildcard', 'Icon', 'Rookie', 'Phantom',
];

// Keyed by Challenge.mode — matches backendPools in src/data/gameData.ts.
export const ModeColors: Record<string, string> = {
  drink:  Colors.tertiary, // cyan — refreshing
  dare:   Colors.orange,
  truth:  Colors.grape,
  chaos:  Colors.primary,  // yellow
  spicy:  Colors.secondary,// pink-red
  custom: Colors.sky,      // user-made
  other:  Colors.sky,      // custom-card catch-all category
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
