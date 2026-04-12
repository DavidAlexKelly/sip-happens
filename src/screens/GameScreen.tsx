// src/screens/GameScreen.tsx
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
import {
  getChallengePool, substituteTokens, Challenge, PenaltyContext,
  ALL_RULE_STARTS, ALL_RULE_ENDS,
} from '../data/gameData';
import { useGame, Player } from '../components/GameContext';

// Persists across game sessions within the same app session.
// Seeded into usedIds on mount so play-again never repeats last game's cards.
// Cleared after the first round of a new game so they can return after that.
let previousGameUsedIds: Set<string> = new Set();

function prioritizeUninvolved(players: Player[], involved: Set<number>): Player[] {
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const uninvolved = players.filter(p => !involved.has(p.id));
  const alreadyInvolved = players.filter(p => involved.has(p.id));
  return [...shuffle(uninvolved), ...shuffle(alreadyInvolved)];
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

const RULE_DRAW_CHANCE = 0.15;

export default function GameScreen({ navigation }: Props) {
  const { state, nextRound, skipRound } = useGame();

  // Dynamic round count based on player count, minimum 20
  const TOTAL_ROUNDS = Math.max(20, state.players.length * 6);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [displayText, setDisplayText] = useState('');

  // Seed usedIds from the previous game so those cards are excluded on play-again
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set(previousGameUsedIds));

  const [usedRuleIds, setUsedRuleIds] = useState<Set<string>>(new Set());
  const [showQuitModal, setShowQuitModal] = useState(false);

  const activeRuleId = useRef<string | null>(null);
  const pendingEndCard = useRef<{ card: Challenge; fireOnRound: number } | null>(null);

  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const involvedRef = useRef<Set<number>>(new Set());
  const currentPlayersRef = useRef<Player[]>([]);

  const buildPenaltyCtx = useCallback((c: Challenge): PenaltyContext => ({
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    intensity: c.intensity,
    mode: state.selectedMode,
    multiplier: state.sipMultiplier,
  }), [state.currentRound, state.totalRounds, state.selectedMode, state.sipMultiplier]);

  const loadChallenge = useCallback(() => {
    const round = state.currentRound;

    // 1. Fire a pending rule-end card if it's due
    if (pendingEndCard.current && round >= pendingEndCard.current.fireOnRound) {
      const endCard = pendingEndCard.current.card;
      pendingEndCard.current = null;
      activeRuleId.current = null;
      const orderedEnd = prioritizeUninvolved(state.players, involvedRef.current);
      currentPlayersRef.current = orderedEnd;
      involvedRef.current.add(orderedEnd[0]?.id);
      if (endCard.text.includes('{player2}') && orderedEnd[1]) involvedRef.current.add(orderedEnd[1].id);
      const text = substituteTokens(endCard.text, orderedEnd, buildPenaltyCtx(endCard));
      setChallenge(endCard);
      setDisplayText(text);
      return;
    }

    // 2. Maybe draw a rule-start card (only if no rule is active)
    if (!activeRuleId.current && Math.random() < RULE_DRAW_CHANCE) {
      const available = ALL_RULE_STARTS.filter(r => !usedRuleIds.has(r.ruleId!));
      if (available.length > 0) {
        const picked = available[Math.floor(Math.random() * available.length)];
        activeRuleId.current = picked.ruleId!;
        setUsedRuleIds(prev => new Set([...prev, picked.ruleId!]));
        const endDelay = 4 + Math.floor(Math.random() * 3);
        const endCard = ALL_RULE_ENDS[picked.ruleId!];
        if (endCard) {
          pendingEndCard.current = { card: endCard, fireOnRound: round + endDelay };
        }
        const orderedStart = prioritizeUninvolved(state.players, involvedRef.current);
        currentPlayersRef.current = orderedStart;
        involvedRef.current.add(orderedStart[0]?.id);
        if (picked.text.includes('{player2}') && orderedStart[1]) involvedRef.current.add(orderedStart[1].id);
        const text = substituteTokens(picked.text, orderedStart, buildPenaltyCtx(picked));
        setChallenge(picked);
        setDisplayText(text);
        return;
      }
    }

    // 3. Draw a normal challenge card
    const pool = getChallengePool(state.selectedMode);
    let available = pool.filter(c => !usedIds.has(c.id));
    if (available.length === 0) {
      setUsedIds(new Set());
      available = pool;
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    setUsedIds(prev => new Set([...prev, picked.id]));

    const orderedNormal = prioritizeUninvolved(state.players, involvedRef.current);
    currentPlayersRef.current = orderedNormal;
    involvedRef.current.add(orderedNormal[0]?.id);
    if (picked.text.includes('{player2}') && orderedNormal[1]) involvedRef.current.add(orderedNormal[1].id);
    const text = substituteTokens(picked.text, orderedNormal, buildPenaltyCtx(picked));
    setChallenge(picked);
    setDisplayText(text);
  }, [state.selectedMode, state.players, state.currentRound, usedIds, usedRuleIds, buildPenaltyCtx]);

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

  const allInvolved = state.players.every(p => involvedRef.current.has(p.id));
  const canEnd = state.currentRound >= TOTAL_ROUNDS && allInvolved;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (canEnd) {
      // Save this game's used cards so play-again excludes them on round 1
      previousGameUsedIds = new Set(usedIds);
      navigation.replace('GameOver');
      return;
    }
    // After round 1 of a new game, let previous cards back into the pool
    if (state.currentRound === 1) {
      previousGameUsedIds = new Set();
    }
    animateCard(() => { nextRound(); loadChallenge(); });
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (canEnd) {
      previousGameUsedIds = new Set(usedIds);
      navigation.replace('GameOver');
      return;
    }
    if (state.currentRound === 1) {
      previousGameUsedIds = new Set();
    }
    animateCard(() => { skipRound(); loadChallenge(); });
  };

  const progress = Math.min(1, Math.max(0.04, state.currentRound / TOTAL_ROUNDS));

  const isRuleCard = challenge?.isRule !== undefined;
  const isRuleStart = challenge?.isRule === true;
  const isRuleEnd = challenge?.isRule === false;
  const modeColor = isRuleStart
    ? '#f5c842'
    : isRuleEnd
    ? '#72e88a'
    : (challenge ? (ModeColors[challenge.mode] || Colors.primary) : Colors.primary);

  const modeLabel = isRuleStart
    ? '📜 NEW RULE'
    : isRuleEnd
    ? '✅ RULE OVER'
    : (challenge ? (ModeLabels[challenge.mode] || challenge.mode.toUpperCase()) : '');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[`${modeColor}18`, 'transparent']}
        style={styles.topGlow}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowQuitModal(true)} style={styles.quitBtn}>
            <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.avatarRow}>
            {state.players.slice(0, 5).map((p) => (
              <View key={p.id} style={[styles.avatar, { marginLeft: -10, borderColor: p.color }]}>
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
          <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: modeColor }]} />
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

          <View style={styles.cardTop}>
            <View style={[styles.categoryBadge, { backgroundColor: `${modeColor}18`, borderColor: `${modeColor}30` }]}>
              <Text style={[styles.categoryLabel, { color: modeColor }]}>{modeLabel}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.challengeText}>{displayText}</Text>
            <View style={[styles.cardDivider, { backgroundColor: modeColor }]} />
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.actionRow}>
              <Ionicons name={(challenge?.icon as any) || 'beer'} size={20} color={modeColor} />
              <Text style={[styles.actionText, { color: modeColor }]}>{challenge?.action || 'Drink up'}</Text>
            </View>
            {!isRuleCard && (
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
            )}
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
            <Text style={styles.modalSubtitle}>Progress will be lost.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowQuitModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Keep Playing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalQuit}
                onPress={() => { setShowQuitModal(false); navigation.replace('Welcome'); }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalQuitText}>Quit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, zIndex: 0 },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quitBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarRow: { flexDirection: 'row', paddingLeft: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 14 },
  progressBarBg: { height: 3, borderRadius: 2, backgroundColor: Colors.surfaceContainerHighest, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  cardWrapper: {
    flex: 1, backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24, padding: 24, borderWidth: 1,
    borderColor: Colors.outlineVariant, overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  categoryLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
  },
  cardBody: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  challengeText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24, color: Colors.onSurface, lineHeight: 32, letterSpacing: -0.5,
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
  intensityDot: { width: 8, height: 8, borderRadius: 4 },
  watermark: { position: 'absolute', bottom: -40, right: -40, opacity: 0.03 },
  actions: { gap: 10, paddingBottom: 8 },
  nextBtn: {
    paddingVertical: 20, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  nextBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14,
  },
  skipText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: Colors.outline,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 32, gap: 8,
  },
  modalTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 22, color: Colors.onSurface },
  modalSubtitle: { fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 16 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest, alignItems: 'center',
  },
  modalCancelText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: Colors.onSurface },
  modalQuit: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: Colors.error, alignItems: 'center' },
  modalQuitText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff' },
});