// src/screens/GameOverScreen.tsx
// Curtain call. "GG." lands on a tilted buzzer-yellow marquee panel, players
// take a bow as colored chips, stats become tilted mini-stickers, and the
// PLAY AGAIN button dominates. Logic unchanged.

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { useGame } from '../components/GameContext';
import { JackButton, JackPanel, ConfettiDots } from '../components/jack';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GameOver'>;
};

const STAT_TILTS = ['-1.5deg', '1deg', '-1deg'];

export default function GameOverScreen({ navigation }: Props) {
  const { state, startGame, resetGame } = useGame();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePlayAgain = () => {
    startGame();
    navigation.replace('Game');
  };

  const handleMainMenu = () => {
    resetGame();
    navigation.replace('Play');
  };

  const stats = [
    { label: 'Rounds', value: Math.min(state.currentRound, state.totalRounds), color: Colors.primary },
    { label: 'Players', value: state.players.length, color: Colors.secondary },
    { label: 'Skipped', value: state.skips, color: Colors.tertiary },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ConfettiDots opacity={0.7} />

      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <JackPanel
            color={Colors.primary}
            tilt={Jack.tiltL}
            shadow={Jack.shadowBig}
            faceStyle={styles.ggFace}
          >
            <Text style={styles.eyebrow}>NIGHT COMPLETE</Text>
            <Text style={styles.ggText}>GG.</Text>
            <Text style={styles.subtitle}>That's a wrap.</Text>
          </JackPanel>
          <Text style={styles.body}>
            Sip Happens has spoken.{'\n'}Refill your glass, legends.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.playersRow, { opacity: fadeAnim }]}>
          {state.players.map((p) => (
            <View key={p.id} style={[styles.playerChip, { borderColor: p.color }]}>
              <View style={[styles.chipOrb, { borderColor: p.color }]}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} style={styles.chipPhoto} />
                ) : (
                  <Text style={[styles.playerChipInitial, { color: p.color }]}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.playerChipName}>{p.name}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {stats.map((s, i) => (
            <JackPanel
              key={s.label}
              color={Colors.surfaceContainer}
              tilt={STAT_TILTS[i]}
              radius={Jack.radius}
              style={{ flex: 1 }}
              faceStyle={styles.statFace}
            >
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </JackPanel>
          ))}
        </Animated.View>

        <Animated.View style={[styles.actionsWrap, { opacity: fadeAnim }]}>
          <JackButton
            label="Play Again"
            icon="refresh"
            onPress={handlePlayAgain}
          />
          <JackButton
            label="Main Menu"
            variant="ghost"
            size="medium"
            onPress={handleMainMenu}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1, paddingHorizontal: 24, paddingTop: 50,
    justifyContent: 'space-between', paddingBottom: 24,
  },

  ggFace: { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 20 },
  eyebrow: {
    fontFamily: Type.display, fontSize: 12, letterSpacing: 2.5, color: Colors.ink, opacity: 0.7,
  },
  ggText: { fontFamily: Type.display, fontSize: 76, color: Colors.ink, marginTop: 2 },
  subtitle: { fontFamily: Type.display, fontSize: 18, color: Colors.ink, opacity: 0.8 },
  body: {
    fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center',
    marginTop: 18, lineHeight: 20,
  },

  playersRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 18, borderWidth: 2.5, backgroundColor: Colors.surfaceContainerLow,
  },
  chipOrb: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.5,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  chipPhoto: { width: 26, height: 26, borderRadius: 13 },
  playerChipInitial: { fontFamily: Type.display, fontSize: 12 },
  playerChipName: { fontFamily: Type.bodyBold, fontSize: 12, color: Colors.onSurface },

  statsRow: { flexDirection: 'row', gap: 14 },
  statFace: { padding: 18, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: Type.display, fontSize: 32 },
  statLabel: {
    fontFamily: Type.display, fontSize: 10, letterSpacing: 2,
    textTransform: 'uppercase', color: Colors.outline,
  },

  actionsWrap: { gap: 14 },
});
