// src/styles/theme.ts
// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — "Sip Happens"
// Direction: late-night cocktail-bar neon sign, not cyberpunk void. Warm ink
// background instead of cold black; citrus coral as the hero color instead of
// magenta; lime + amber for the "fresh / warm" split a drinks menu would use.
//
// Fixed: ModeColors/ModeLabels were previously keyed by 'social'/'wild', which
// never matched the actual card mode values ('drink'/'dare'/'truth'/'chaos'/
// 'spicy' — see src/data/gameData.ts backendPools). Every card was silently
// falling back to the default primary color. Now keyed correctly, plus a
// 'custom' entry for user-made decks.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  background: '#0C0A12',
  surfaceContainerLow: '#141019',
  surfaceContainer: '#1B1524',
  surfaceContainerHigh: '#241B31',
  surfaceContainerHighest: '#2E2340',
  surfaceBright: '#392B4A',

  primary: '#FF6B4A',        // citrus coral — the hero color
  primaryContainer: '#E5502E',
  primaryDim: '#FF8A6E',
  onPrimary: '#2B0A02',

  secondary: '#C6FF5E',      // lime — fresh / "getting started"
  onSecondary: '#1C2E00',

  tertiary: '#FFC24B',       // amber — warm / rules & warnings
  onTertiary: '#2E1B00',

  onSurface: '#FBF3E7',      // warm paper white, not clinical white
  onSurfaceVariant: '#B3A9C2',
  onBackground: '#FBF3E7',

  outline: '#8A7F9E',
  outlineVariant: '#3A2F4D',

  error: '#FF5470',
  errorContainer: '#4A0E1E',
} as const;

// Distinct, collision-friendly avatar/player palette.
export const PlayerColors = [
  '#FF6B4A', // coral
  '#C6FF5E', // lime
  '#FFC24B', // amber
  '#7A5CFF', // grape
  '#3AD6C4', // teal
  '#FF4F9A', // hot pink
  '#5EC8FF', // sky
  '#FBF3E7', // foam
];

export const PlayerRanks = [
  'Legend', 'Pro Level', 'Challenger', 'Newbie',
  'Wildcard', 'Icon', 'Rookie', 'Phantom',
];

// Keyed by Challenge.mode — matches backendPools in src/data/gameData.ts.
export const ModeColors: Record<string, string> = {
  drink:  '#3AD6C4', // teal — refreshing
  dare:   '#FF6B4A', // coral
  truth:  '#7A5CFF', // grape
  chaos:  '#FFC24B', // amber
  spicy:  '#FF3B5C', // hot red
  custom: '#5EC8FF', // sky — user-made
};

export const ModeLabels: Record<string, string> = {
  drink:  'Drink',
  dare:   'Dare',
  truth:  'Truth',
  chaos:  'Chaos',
  spicy:  'Spicy 🌶️',
  custom: 'Your Deck',
};

// Typography roles. Both families are already bundled via
// @expo-google-fonts — no new font packages needed.
export const Type = {
  display: 'PlusJakartaSans_800ExtraBold',
  displayItalic: 'PlusJakartaSans_800ExtraBold_Italic', // signature accent — see Logo.tsx
  bodyBold: 'BeVietnamPro_700Bold',
  bodyMedium: 'BeVietnamPro_500Medium',
  body: 'BeVietnamPro_400Regular',
} as const;