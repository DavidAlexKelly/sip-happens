// src/screens/PlayScreen.tsx
// The title stage. Confetti-dotted indigo backdrop, a tilted marquee panel
// carrying the wordmark, and one giant buzzer-yellow START sticker that
// gently pulses. Logic unchanged: resetGame → DeckSelect.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { APP_TAGLINE } from '../branding';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import { JackButton, JackPanel, JackBadge, ConfettiDots } from '../components/jack';
import { useGame } from '../components/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Play'>;
};

export default function PlayScreen({ navigation }: Props) {
  const { resetGame } = useGame();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    resetGame();
    navigation.navigate('DeckSelect');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConfettiDots opacity={0.55} />

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.logoRow}>
          <Logo />
        </View>

        {/* Marquee panel — the stage sign */}
        <JackPanel
          color={Colors.surfaceContainer}
          tilt={Jack.tiltL}
          shadow={Jack.shadowBig}
          faceStyle={styles.marqueeFace}
        >
          <JackBadge label="Party Game" color={Colors.secondary} textColor="#fff" tilt={Jack.tiltR} />
          <Text style={styles.heroLine1}>LET'S GET</Text>
          <Text style={styles.heroLine2}>SIPPING.</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        </JackPanel>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <JackButton
            label="Start a Game"
            icon="arrow-forward"
            onPress={handleStart}
          />
        </Animated.View>
      </Animated.View>

      <BottomNav current="play" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1, paddingHorizontal: 26, justifyContent: 'center', paddingBottom: 90, gap: 34,
  },
  logoRow: { alignItems: 'flex-start' },
  marqueeFace: { padding: 26, gap: 6 },
  heroLine1: {
    fontFamily: Type.display, fontSize: 46, lineHeight: 50, color: Colors.onSurface,
    letterSpacing: -0.5, marginTop: 12,
  },
  heroLine2: {
    fontFamily: Type.display, fontSize: 46, lineHeight: 50, color: Colors.primary,
    letterSpacing: -0.5, marginBottom: 10,
  },
  tagline: {
    fontFamily: Type.body, fontSize: 15, lineHeight: 22, color: Colors.onSurfaceVariant,
    maxWidth: 280,
  },
});
