// src/screens/PlayScreen.tsx
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
import { Colors, Type } from '../styles/theme';
import { APP_TAGLINE } from '../branding';
import Logo from '../components/Logo';
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
      {/* Top glow — citrus coral instead of magenta */}
      <LinearGradient
        colors={['rgba(255,107,74,0.14)', 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoRow}>
          <Logo size="large" />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>HOUSE PARTY ESSENTIAL</Text>
          <Text style={styles.heroLine1}>SPILL</Text>
          <Text style={styles.heroLine2}>THE TEA.</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity onPress={handleStart} activeOpacity={0.88}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.startBtn}
            >
              <Text style={styles.startBtnText}>START THE NIGHT</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <BottomNav current="play" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  content: {
    flex: 1, paddingHorizontal: 28, justifyContent: 'center', paddingBottom: 90, gap: 40,
  },
  logoRow: { alignItems: 'flex-start' },
  hero: { gap: 4 },
  eyebrow: {
    fontFamily: Type.bodyBold, fontSize: 12, letterSpacing: 2.5,
    color: Colors.secondary, marginBottom: 10,
  },
  heroLine1: {
    fontFamily: Type.display, fontSize: 56, lineHeight: 58, color: Colors.onSurface,
    letterSpacing: -1,
  },
  heroLine2: {
    fontFamily: Type.display, fontSize: 56, lineHeight: 58, color: Colors.primary,
    letterSpacing: -1, marginBottom: 16,
  },
  tagline: {
    fontFamily: Type.body, fontSize: 16, lineHeight: 24, color: Colors.onSurfaceVariant,
    maxWidth: 300,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 60, borderRadius: 30,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  startBtnText: {
    fontFamily: Type.display, fontSize: 16, letterSpacing: 1.5, color: Colors.onPrimary,
  },
});