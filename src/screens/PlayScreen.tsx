import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../styles/theme';
import BottomNav from '../components/BottomNav';
import { useGame } from '../components/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Play'>;
};

export default function PlayScreen({ navigation }: Props) {
  const { resetGame } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.97, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleStart = () => {
    resetGame();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('DeckSelect');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top glow */}
      <LinearGradient
        colors={['rgba(255,122,251,0.10)', 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>NEKKIT</Text>
          </LinearGradient>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLine1}>ENTER</Text>
          <Text style={styles.heroLine2}>THE VOID.</Text>
          <Text style={styles.tagline}>
            A high-energy social challenge.{'\n'}Only the luminous survive.
          </Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            { icon: 'people', value: '8', label: 'Max players' },
            { icon: 'card',   value: '100+', label: 'Challenges' },
            { icon: 'layers', value: '4',   label: 'Built-in decks' },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Ionicons name={s.icon as any} size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity onPress={handleStart} activeOpacity={0.88} style={styles.startBtnWrapper}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.startBtn}
            >
              <Ionicons name="play" size={24} color={Colors.onPrimary} />
              <Text style={styles.startBtnText}>START GAME</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.hint}>Select decks and players in the next steps</Text>
      </Animated.View>

      <BottomNav current="play" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  content: {
    flex: 1, paddingHorizontal: 28, paddingBottom: 120,
    justifyContent: 'center', gap: 32,
  },
  logoRow: { alignItems: 'center' },
  logoGradient: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4 },
  logoText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 15, letterSpacing: 2, color: Colors.onPrimary,
  },
  hero: { alignItems: 'center', gap: 12 },
  heroLine1: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 76, color: Colors.onSurface,
    lineHeight: 76, letterSpacing: -4,
  },
  heroLine2: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 76, color: Colors.primary,
    lineHeight: 76, letterSpacing: -4, marginTop: -8,
    textShadowColor: 'rgba(255,122,251,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  tagline: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurfaceVariant,
    textAlign: 'center', lineHeight: 22, marginTop: 4,
  },
  statsStrip: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20, paddingVertical: 18,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20, color: Colors.onSurface,
  },
  statLabel: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11, color: Colors.outline,
  },
  startBtnWrapper: {},
  startBtn: {
    paddingVertical: 22, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 28, shadowOffset: { width: 0, height: 8 },
  },
  startBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
  hint: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12, color: Colors.outline, textAlign: 'center',
  },
});