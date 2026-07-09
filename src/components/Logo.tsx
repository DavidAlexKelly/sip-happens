// src/components/Logo.tsx
// Jackbox-style wordmark: "SIP" lives on a tilted buzzer-yellow sticker with
// an ink border and hard shadow; "HAPPENS!" runs alongside in the italic
// display face. Same component API as before (size: 'small' | 'large').

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Jack, Type } from '../styles/theme';

type Size = 'small' | 'large';

export default function Logo({ size = 'small' }: { size?: Size }) {
  const isLarge = size === 'large';
  return (
    <View style={styles.row}>
      <View style={[styles.chipOuter, { transform: [{ rotate: Jack.tiltL }] }]}>
        <View style={[styles.chipShadow, isLarge && styles.chipShadowLarge]} />
        <View style={[styles.chip, isLarge && styles.chipLarge]}>
          <Text style={[styles.chipText, isLarge && styles.chipTextLarge]}>SIP</Text>
          <Ionicons
            name="water"
            size={isLarge ? 15 : 11}
            color={Colors.ink}
          />
        </View>
      </View>
      <Text style={[styles.wordmark, isLarge && styles.wordmarkLarge]}>HAPPENS!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chipOuter: { position: 'relative' },
  chipShadow: {
    position: 'absolute', top: 3, left: 0, right: 0, bottom: 0,
    borderRadius: 10, backgroundColor: Colors.ink,
  },
  chipShadowLarge: { top: 4, borderRadius: 13 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 10, borderWidth: 2.5, borderColor: Colors.ink,
    marginBottom: 3,
  },
  chipLarge: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 13,
    borderWidth: 3, marginBottom: 4,
  },
  chipText: {
    fontFamily: Type.display, fontSize: 15, color: Colors.ink,
    letterSpacing: 0.5,
  },
  chipTextLarge: { fontSize: 23 },
  wordmark: {
    fontFamily: Type.displayItalic, fontSize: 17, color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  wordmarkLarge: { fontSize: 26 },
});
