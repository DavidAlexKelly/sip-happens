import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Modal, BackHandler, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, ModeColors, ModeLabels } from '../styles/theme';
import { getChallengePool, substituteTokens, Challenge, PenaltyContext } from '../data/gameData';
import { useGame } from '../components/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

const TOTAL_ROUNDS = 20;
const MULTIPLIER_STEPS = [1, 2, 3, 4] as const;

export default function GameScreen({ navigation }: Props) {
  const { state, nextRound, skipRound, setSipMultiplier } = useGame();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [displayText, setDisplayText] = useState('');
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [showQuitModal, setShowQuitModal] = useState(false);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // Animated value for the multiplier pill sliding between steps
  const multiplierAnim = useRef(new Animated.Value(state.sipMultiplier - 1)).current;

  const buildPenaltyCtx = useCallback((c: Challenge): PenaltyContext => ({
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    intensity: c.intensity,
    mode: state.selectedMode,
    multiplier: state.sipMultiplier,
  }), [state.currentRound, state.totalRounds, state.selectedMode, state.sipMultiplier]);

  const loadChallenge = useCallback(() => {
    const pool = getChallengePool(state.selectedMode);
    let available = pool.filter(c => !usedIds.has(c.id));
    if (available.length === 0) {
      setUsedIds(new Set());
      available = pool;
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    setUsedIds(prev => new Set([...prev, picked.id]));
    setChallenge(picked);
    setDisplayText(substituteTokens(picked.text, state.players, buildPenaltyCtx(picked)));
  }, [state.selectedMode, state.players, usedIds, buildPenaltyCtx]);

  // Re-render display text live when multiplier changes (without picking a new card)
  useEffect(() => {
    if (challenge) {
      setDisplayText(substituteTokens(challenge.text, state.players, buildPenaltyCtx(challenge)));
    }
  }, [state.sipMultiplier]);

  useEffect(() => {
    loadChallenge();
  }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowQuitModal(true);
      return true;
    });
    return () => handler.remove();
  }, []);

  const handleMultiplierChange = (value: 1 | 2 | 3 | 4) => {
    if (value === state.sipMultiplier) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSipMultiplier(value);
    Animated.spring(multiplierAnim, {
      toValue: value - 1,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const animateCard = (onMidpoint: () => void) => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: -20, duration: 180, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.95, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      onMidpoint();
      cardTranslate.setValue(20);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(cardTranslate, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (state.currentRound >= TOTAL_ROUNDS) {
      navigation.replace('GameOver');
      return;
    }
    animateCard(() => {
      nextRound();
      loadChallenge();
    });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (state.currentRound >= TOTAL_ROUNDS) {
      navigation.replace('GameOver');
      return;
    }
    animateCard(() => {
      skipRound();
      loadChallenge();
    });
  };

  const progress = Math.max(0.04, state.currentRound / TOTAL_ROUNDS);
  const modeColor = challenge ? (ModeColors[challenge.mode] || Colors.primary) : Colors.primary;
  const modeLabel = challenge ? (ModeLabels[challenge.mode] || challenge.mode) : '';

  // Width of a single step segment (calculated at render, used for pill animation)
  const SLIDER_WIDTH = 160; // px — matches styles.multiplierTrack width
  const STEP_WIDTH = SLIDER_WIDTH / 4;
  const pillTranslateX = multiplierAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, STEP_WIDTH, STEP_WIDTH * 2, STEP_WIDTH * 3],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.ambientGlow, { backgroundColor: `${modeColor}12` }]} pointerEvents="none" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowQuitModal(true)}>
          <Ionicons name="close" size={24} color={Colors.onSurface} style={{ opacity: 0.5 }} />
        </TouchableOpacity>
        <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleGradient}>
          <Text style={styles.headerTitle}>ELECTRIC NOCTURNE</Text>
        </LinearGradient>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Round counter + avatars */}
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.roundLabel}>Round</Text>
            <Text style={styles.roundNumber}>
              <Text style={styles.roundCurrent}>{state.currentRound}</Text>
              <Text style={styles.roundDivider}>/</Text>
              <Text style={styles.roundTotal}>{TOTAL_ROUNDS}</Text>
            </Text>
          </View>
          <View style={styles.avatarRow}>
            {state.players.slice(0, 5).map((p, i) => (
              <View key={p.id} style={[styles.avatar, { zIndex: 10 - i, marginLeft: i === 0 ? 0 : -10, borderColor: p.color }]}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} style={styles.avatarPhoto} />
                ) : (
                  <Text style={[styles.avatarText, { color: p.color }]}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            ))}
            {state.players.length > 5 && (
              <View style={[styles.avatar, { marginLeft: -10, backgroundColor: Colors.surfaceContainerHighest, borderColor: Colors.outlineVariant }]}>
                <Text style={[styles.avatarText, { color: Colors.onSurfaceVariant, fontSize: 10 }]}>
                  +{state.players.length - 5}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Challenge card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslate }, { scale: cardScale }] },
          ]}
        >
          <LinearGradient
            colors={[`${modeColor}28`, `${modeColor}08`]}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          {/* Card top: mode badge + multiplier slider */}
          <View style={styles.cardTop}>
            <View style={[styles.categoryBadge, { backgroundColor: `${modeColor}18`, borderColor: `${modeColor}30` }]}>
              <Text style={[styles.categoryLabel, { color: modeColor }]}>{modeLabel}</Text>
            </View>

            {/* Multiplier segmented slider */}
            <View style={styles.multiplierWrapper}>
              <Text style={styles.multiplierEyebrow}>SIPS ×</Text>
              <View style={styles.multiplierTrack}>
                {/* Animated sliding pill */}
                <Animated.View
                  style={[
                    styles.multiplierPill,
                    {
                      width: STEP_WIDTH,
                      backgroundColor: modeColor,
                      transform: [{ translateX: pillTranslateX }],
                    },
                  ]}
                />
                {/* Tap targets */}
                {MULTIPLIER_STEPS.map(step => (
                  <TouchableOpacity
                    key={step}
                    style={styles.multiplierStep}
                    onPress={() => handleMultiplierChange(step)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.multiplierStepLabel,
                      state.sipMultiplier === step && { color: Colors.onPrimary, fontFamily: 'PlusJakartaSans_800ExtraBold' },
                    ]}>
                      {step}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Challenge text */}
          <View style={styles.cardBody}>
            <Text style={styles.challengeText}>{displayText}</Text>
            <View style={[styles.cardDivider, { backgroundColor: modeColor }]} />
          </View>

          {/* Card bottom */}
          <View style={styles.cardBottom}>
            <View style={styles.actionRow}>
              <Ionicons name={(challenge?.icon as any) || 'beer'} size={20} color={modeColor} />
              <Text style={[styles.actionText, { color: modeColor }]}>{challenge?.action || 'Drink up'}</Text>
            </View>
            <View style={styles.intensityBlock}>
              <Text style={styles.intensityLabel}>Intensity</Text>
              <View style={styles.intensityDots}>
                {[1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.intensityDot,
                      { backgroundColor: i <= (challenge?.intensity || 1) ? modeColor : Colors.outlineVariant },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.watermark} pointerEvents="none">
            <Ionicons name="game-controller" size={200} color={Colors.onSurface} style={{ opacity: 0.03 }} />
          </View>
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>NEXT CHALLENGE</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Ionicons name="play-skip-forward" size={18} color={Colors.outline} />
            <Text style={styles.skipText}>Skip this round</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quit Modal */}
      <Modal visible={showQuitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Quit the game?</Text>
            <Text style={styles.modalSubtitle}>Progress will be lost. The night demands commitment.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.surfaceContainerHighest }]}
                onPress={() => setShowQuitModal(false)}
              >
                <Text style={styles.modalBtnText}>STAY IN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.errorContainer }]}
                onPress={() => { setShowQuitModal(false); navigation.replace('Welcome'); }}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>QUIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 300, opacity: 0.6,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: 'rgba(14,14,17,0.8)',
  },
  titleGradient: { borderRadius: 4 },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 17, letterSpacing: -0.5, color: Colors.onPrimary, paddingHorizontal: 4,
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roundLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline, marginBottom: 2,
  },
  roundNumber: { flexDirection: 'row' },
  roundCurrent: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: Colors.onSurface },
  roundDivider: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: Colors.primary },
  roundTotal: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: Colors.onSurface, opacity: 0.4 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, overflow: 'hidden',
  },
  avatarPhoto: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14 },
  progressBarBg: {
    height: 3, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 2, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 2, backgroundColor: Colors.primary },
  cardWrapper: {
    flex: 1, borderRadius: 24, padding: 28,
    backgroundColor: 'rgba(37,37,42,0.7)',
    overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 15 },
    justifyContent: 'space-between',
  },

  // Card top row — badge on left, multiplier on right
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  categoryLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
  },

  // Multiplier slider
  multiplierWrapper: { alignItems: 'flex-end', gap: 4 },
  multiplierEyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 8, letterSpacing: 2, textTransform: 'uppercase',
    color: Colors.outline,
  },
  multiplierTrack: {
    width: 160,
    height: 28,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 999,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  multiplierPill: {
    position: 'absolute',
    top: 0, bottom: 0,
    borderRadius: 999,
  },
  multiplierStep: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  multiplierStepLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, color: Colors.outline,
  },

  cardBody: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  challengeText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 26, color: Colors.onSurface, lineHeight: 34, letterSpacing: -0.5,
  },
  cardDivider: { width: 48, height: 2, borderRadius: 2, marginTop: 20, opacity: 0.6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
  },
  intensityBlock: { alignItems: 'flex-end', gap: 4 },
  intensityLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.outline,
  },
  intensityDots: { flexDirection: 'row', gap: 4 },
  intensityDot: { width: 16, height: 3, borderRadius: 2 },
  watermark: { position: 'absolute', bottom: -20, right: -20 },
  actions: { gap: 16 },
  nextBtn: {
    paddingVertical: 22, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  nextBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
  skipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4 },
  skipText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: Colors.outline,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 32, gap: 16,
  },
  modalTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, color: Colors.onSurface },
  modalSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  modalBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: Colors.onSurface,
  },
});