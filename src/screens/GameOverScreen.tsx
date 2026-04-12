import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../styles/theme';
import { useGame } from '../components/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GameOver'>;
};

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
    navigation.replace('Welcome');
  };

  const stats = [
    { label: 'Rounds', value: state.currentRound - 1, color: Colors.primary },
    { label: 'Players', value: state.players.length, color: Colors.secondary },
    { label: 'Skipped', value: state.skips, color: Colors.tertiary },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(255,122,251,0.12)', 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.eyebrow}>Night Complete</Text>
          <Text style={styles.ggText}>GG.</Text>
          <Text style={styles.subtitle}>That's a wrap!</Text>
          <Text style={styles.body}>
            You survived the Betterlo .{'\n'}Pour one out for the legends who made it.
          </Text>
        </Animated.View>

        {/* Player shoutout */}
        <Animated.View style={[styles.playersRow, { opacity: fadeAnim }]}>
          {state.players.map((p) => (
            <View key={p.id} style={[styles.playerChip, { borderColor: `${p.color}40` }]}>
              <View style={[styles.chipOrb, { borderColor: `${p.color}60` }]}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} style={styles.chipPhoto} />
                ) : (
                  <Text style={[styles.playerChipText, { color: p.color }]}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.playerChipName}>{p.name}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          {stats.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={handlePlayAgain} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              <Ionicons name="refresh" size={20} color={Colors.onPrimary} />
              <Text style={styles.primaryBtnText}>PLAY AGAIN</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleMainMenu} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>MAIN MENU</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  content: {
    flex: 1, paddingHorizontal: 28, justifyContent: 'center',
    gap: 28, paddingBottom: 32,
  },
  hero: { alignItems: 'center', gap: 8 },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: Colors.secondary,
  },
  ggText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 96, color: Colors.primary, lineHeight: 96,
    textShadowColor: 'rgba(255,122,251,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 26, color: Colors.onSurface },
  body: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22,
  },
  playersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
    backgroundColor: Colors.surfaceContainerLow,
  },
  chipOrb: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, overflow: 'hidden',
  },
  chipPhoto: { width: 26, height: 26, borderRadius: 13 },
  playerChipText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 12 },
  playerChipName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: Colors.onSurface },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 20, alignItems: 'center', gap: 6,
  },
  statValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32 },
  statLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: Colors.outline,
  },
  actions: { gap: 12 },
  primaryBtn: {
    paddingVertical: 20, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  primaryBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
  secondaryBtn: {
    paddingVertical: 18, borderRadius: 16,
    alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest,
  },
  secondaryBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: Colors.onSurface,
  },
});