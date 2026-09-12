// src/components/TokenText.tsx
// Renders card text with {tokens} as inline sticker pills instead of raw
// braces — "{player1} drinks {sip}" becomes [Player 1] drinks [sip].
// Used in the card editor preview, My Cards list, and the built-in library.

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Type } from '../styles/theme';
import { TOKEN_META } from '../data/tokens';

export { TOKEN_META };


type Props = {
  text: string;
  /** 'paper' = ink text on light card faces, 'stage' = chalk text on indigo. */
  variant?: 'paper' | 'stage';
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
};

export default function TokenText({ text, variant = 'paper', fontSize = 14, style }: Props) {
  const textColor = variant === 'paper' ? Colors.ink : Colors.onSurface;
  const lineHeight = Math.round(fontSize * 1.75);

  // Split into token / plain segments, then plain segments into words so the
  // row can wrap naturally between words and pills.
  const parts = text.split(/(\{\w+\})/g);
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, pi) => {
    const match = part.match(/^\{(\w+)\}$/);
    if (match) {
      const meta = TOKEN_META[match[1]] ?? {
        label: match[1].replace(/_/g, ' '),
        color: Colors.paperDim,
      };
      nodes.push(
        <View key={`t-${pi}`} style={[styles.pill, { backgroundColor: meta.color }]}>
          <Text style={styles.pillText} numberOfLines={1}>{meta.label}</Text>
        </View>,
      );
    } else if (part.length > 0) {
      part.split(/\s+/).forEach((word, wi) => {
        if (!word) return;
        nodes.push(
          <Text
            key={`w-${pi}-${wi}`}
            style={{ fontFamily: Type.bodyMedium, fontSize, lineHeight, color: textColor }}
          >
            {word}{' '}
          </Text>,
        );
      });
    }
  });

  return <View style={[styles.row, style]}>{nodes}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  pill: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1.5, borderColor: Colors.ink,
    marginRight: 5, marginVertical: 2,
  },
  pillText: {
    fontFamily: Type.display, fontSize: 11, color: Colors.ink, letterSpacing: 0.3,
  },
});
