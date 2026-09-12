// src/screens/RingOverScreen.tsx
// Ring of Fire results. There is no score — the classic game doesn't keep one
// — so this is the story of the round: who got the last King, how far into the
// deck you got, and every rule the Jacks created.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { DECK_SIZE } from '../data/playingCards';
import { useGame } from '../components/GameContext';
import { readRingSummary } from '../hooks/useRingEngine';
import { JackButton, JackPanel, ConfettiDots } from '../components/jack';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RingOver'>;
};

export default function RingOverScreen({ navigation }: Props) {
  const { state } = useGame();
  const summary = readRingSummary();

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  const loser = summary?.finalKingPlayerId != null
    ? state.players.find(p => p.id === summary.finalKingPlayerId)
    : undefined;

  const cardsPlayed = summary?.cardsPlayed ?? 0;
  const houseRules = summary?.houseRules ?? [];

  const stats = [
    { label: 'Cards', value: `${cardsPlayed}/${summary?.deckSize ?? DECK_SIZE}`, color: Colors.primary },
    { label: 'Kings', value: String(summary?.kingsDrawn ?? 0), color: Colors.error },
    { label: 'Rules', value: String(houseRules.length), color: Colors.tertiary },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConfettiDots opacity={0.6} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
          <JackPanel
            color={Colors.error}
            tilt={Jack.tiltL}
            shadow={Jack.shadowBig}
            faceStyle={styles.headlineFace}
          >
            <Text style={styles.eyebrow}>RING BROKEN</Text>
            {loser ? (
              <>
                <Text style={styles.headline}>{loser.name.toUpperCase()}</Text>
                <Text style={styles.subhead}>drank the glass</Text>
              </>
            ) : (
              <>
                <Text style={styles.headline}>NO LAST KING</Text>
                <Text style={styles.subhead}>you bailed out early</Text>
              </>
            )}
          </JackPanel>
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: fade }]}>
          {stats.map((s, i) => (
            <JackPanel
              key={s.label}
              color={Colors.surfaceContainer}
              tilt={i % 2 === 0 ? Jack.tiltR : Jack.tiltL}
              radius={Jack.radius}
              style={{ flex: 1 }}
              faceStyle={styles.statFace}
            >
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </JackPanel>
          ))}
        </Animated.View>

        {houseRules.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fade }]}>
            <Text style={styles.sectionLabel}>THE RULES YOU MADE</Text>
            <View style={styles.ruleList}>
              {houseRules.map((r, i) => {
                const by = state.players.find(p => p.id === r.byPlayerId);
                return (
                  <View key={r.id} style={styles.ruleRow}>
                    <Text style={styles.ruleNum}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ruleText}>{r.text}</Text>
                      {by && <Text style={styles.ruleBy}>set by {by.name}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.actions, { opacity: fade }]}>
          <JackButton
            label="Play Again"
            icon="refresh"
            onPress={() => navigation.replace('RingGame')}
          />
          <JackButton
            label="Main Menu"
            variant="ghost"
            size="medium"
            onPress={() => navigation.replace('Play')}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32, gap: 22 },

  headlineFace: { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 18 },
  eyebrow: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 2.5,
    color: Colors.ink, opacity: 0.75,
  },
  headline: {
    fontFamily: Type.display, fontSize: 40, lineHeight: 44,
    color: Colors.ink, textAlign: 'center', marginTop: 2,
  },
  subhead: {
    fontFamily: Type.display, fontSize: 15, color: Colors.ink, opacity: 0.85,
  },

  statsRow: { flexDirection: 'row', gap: 12 },
  statFace: { padding: 16, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: Type.display, fontSize: 24 },
  statLabel: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 2,
    textTransform: 'uppercase', color: Colors.outline,
  },

  section: { gap: 10 },
  sectionLabel: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 2, color: Colors.outline,
  },
  ruleList: { gap: 8 },
  ruleRow: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Jack.radius, borderWidth: 2, borderColor: Colors.outlineVariant,
    padding: 12,
  },
  ruleNum: { fontFamily: Type.display, fontSize: 13, color: Colors.primary, width: 16 },
  ruleText: { fontFamily: Type.bodyBold, fontSize: 13.5, color: Colors.onSurface },
  ruleBy: {
    fontFamily: Type.body, fontSize: 11, color: Colors.outline, marginTop: 2,
  },

  actions: { gap: 12, marginTop: 4 },
});
