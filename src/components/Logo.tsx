// src/components/Logo.tsx
// The signature element of the redesign: a two-weight wordmark — "sip" sits
// solid inside a coral chip (like a bottle cap / drinks-menu tag), "happens"
// runs alongside it in the italic display face already bundled in the app
// (PlusJakartaSans_800ExtraBold_Italic — previously imported and unused).
// A single droplet dots the "i", tying the mark back to the drinking-game
// subject without leaning on a literal glass/bottle icon.
//
// Replaces the old gradient-pill "NEKKIT" lockup in PlayScreen, PlayersScreen,
// DecksScreen and CardsScreen — one component, used everywhere, so the brand
// mark can never drift out of sync again.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Type } from '../styles/theme';

type Size = 'small' | 'large';

export default function Logo({ size = 'small' }: { size?: Size }) {
  const isLarge = size === 'large';
  return (
    <View style={styles.row}>
      <View style={[styles.chip, isLarge && styles.chipLarge]}>
        <Text style={[styles.chipText, isLarge && styles.chipTextLarge]}>sip</Text>
        <Ionicons
          name="water"
          size={isLarge ? 14 : 10}
          color={Colors.onPrimary}
          style={styles.drop}
        />
      </View>
      <Text style={[styles.wordmark, isLarge && styles.wordmarkLarge]}>happens</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10,
  },
  chipLarge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  chipText: {
    fontFamily: Type.display, fontSize: 15, color: Colors.onPrimary,
    letterSpacing: 0.2,
  },
  chipTextLarge: { fontSize: 22 },
  drop: { marginTop: 1 },
  wordmark: {
    fontFamily: Type.displayItalic, fontSize: 17, color: Colors.onSurface,
  },
  wordmarkLarge: { fontSize: 25 },
});