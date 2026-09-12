// src/data/tokens.ts
// The {token} palette: how each card token is labelled and coloured.
//
// This is DATA, not a component. It used to live in components/TokenText.tsx,
// which meant utils/cardTitles.ts — and therefore the whole scope-adapter
// chain — pulled a .tsx file and React Native into what should be pure logic.
// TokenText re-exports it so existing imports keep working.

import { Colors } from '../styles/theme';

export const TOKEN_META: Record<string, { label: string; color: string }> = {
  player1: { label: 'Player 1', color: Colors.primary },
  player2: { label: 'Player 2', color: Colors.orange },
  sip:     { label: 'sip',      color: Colors.tertiary },
  small:   { label: 'small',    color: Colors.lime },
  medium:  { label: 'medium',   color: Colors.sky },
  large:   { label: 'large',    color: Colors.secondary },
  max:     { label: 'MAX',      color: Colors.grape },
  take_or_give_sip:    { label: 'take/give sip',    color: Colors.tertiary },
  take_or_give_small:  { label: 'take/give small',  color: Colors.lime },
  take_or_give_medium: { label: 'take/give medium', color: Colors.sky },
  take_or_give_large:  { label: 'take/give large',  color: Colors.secondary },
  take_or_give_max:    { label: 'take/give MAX',    color: Colors.grape },
  topic:   { label: 'random topic', color: Colors.paper },
};
