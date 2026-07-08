// src/screens/GameScreen.tsx
// Rewritten around useCardEngine. What changed vs the old version:
//   • All draw logic moved to the engine (no more stale-closure round math)
//   • BACK button — step back through cards you swiped past by accident
//   • Custom decks are now actually playable (merged into the pool, crash-proof)
//   • Round count reads state.totalRounds (single source of truth in context)
//   • Juice: press-scale on the main button, richer haptics per action type,
//     rule cards get a success-notification buzz
//   • A pending rule-end card holds the game open one extra card so no rule
//     is left running forever

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Modal, BackHandler, Image, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, ModeColors, ModeLabels } from '../styles/theme';
import { Challenge, PenaltyContext, MODES } from '../data/gameData';
import { useGame } from '../components/GameContext';
import { useCardEngine } from '../hooks/useCardEngine';
import {
  loadCustomDecks, loadCustomCards, buildCustomPool, splitSelection,
} from '../data/CustomDecks'
import { Ads } from '../monetization/ads';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
};

const BUILT_IN_MODE_IDS = MODES.map(m => m.id);

export default function GameScreen({ navigation }: Props) {
  const { state, nextRound, skipRound } = useGame();

  const [extraPool, setExtraPool] = useState<Challenge[]>([]);
  const [poolReady, setPoolReady] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  const { modeIds } = splitSelection(state.selectedModes, BUILT_IN_MODE_IDS);

  const buildPenaltyCtx = useCallback((c: Challenge): PenaltyContext => ({
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    intensity: c.intensity,
    mode: state.selectedModes[0] ?? 'social',
    bonus: state.sipBonus,
  }), [state.currentRound, state.totalRounds, state.selectedModes, state.sipBonus]);

  const engine = useCardEngine({
    players: state.players,
    modeIds,
    extraPool,
    totalRounds: state.totalRounds,
    buildPenaltyCtx,
  });

  // ── Animations ──────────────────────────────────────────────
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const animateCard = (direction: 1 | -1, onMidpoint: () => void) => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: -22 * direction, duration: 160, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 0.95, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      onMidpoint();
      cardTranslate.setValue(22 * direction);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(cardTranslate, { toValue: 0, tension: 90, friction: 10, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 90, friction: 10, useNativeDriver: true }),
      ]).start();
    });
  };

  // ── Boot: resolve custom decks, then draw the first card ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [decks, cards] = await Promise.all([loadCustomDecks(), loadCustomCards()]);
      if (cancelled) return;
      const { customDeckIds } = splitSelection(state.selectedModes, BUILT_IN_MODE_IDS);
      setExtraPool(buildCustomPool(customDeckIds, decks, cards));
      setPoolReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (poolReady && !engine.current) {
      const { card } = engine.drawNext(state.currentRound || 1);
      if (card.challenge.isRule) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolReady]);

  // ── Android hardware back → quit confirm ───────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowQuitModal(true);
      return true;
    });
    return () => handler.remove();
  }, []);

  // ── End condition ───────────────────────────────────────────
  // The game can finish once every player has been featured and the round
  // target is met — but never while a rule is still open: the scheduled
  // RULE OVER card must be shown first.
  const canEnd =
    state.currentRound >= state.totalRounds &&
    engine.allPlayersInvolved() &&
    !engine.hasPendingRuleEnd();

  // One interstitial per game at the halfway mark (plus one at the end).
  const midpointAdShown = useRef(false);

  const advance = (skipped: boolean) => {
    // ── Ad placement 2: game end — interstitial, then Game Over.
    //    Fail-open: if no ad is loaded, Ads.show() runs the callback instantly.
    if (canEnd) {
      engine.finishGame();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Ads.show(() => navigation.replace('GameOver'));
      return;
    }
    if (state.currentRound === 1) engine.releasePreviousGameCards();

    const goNext = () => {
      animateCard(1, () => {
        const { card, isNew } = engine.drawNext(state.currentRound + 1);
        if (isNew) (skipped ? skipRound : nextRound)();
        if (card.challenge.isRule) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      });
    };

    // ── Ad placement 1: midpoint — fires once, on the advance that crosses
    //    the halfway round. User closes the ad (Google's built-in X), then
    //    the next card animates in.
    const midRound = Math.ceil(state.totalRounds / 2);
    if (!midpointAdShown.current && state.currentRound + 1 > midRound) {
      midpointAdShown.current = true;
      Ads.show(goNext);
      return;
    }

    goNext();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    advance(false);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advance(true);
  };

  const handleBack = () => {
    if (!engine.canGoBack) return;
    Haptics.selectionAsync();
    animateCard(-1, () => { engine.goBack(); });
  };

  const pressIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, tension: 200, friction: 12, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(btnScale, { toValue: 1, tension: 200, friction: 12, useNativeDriver: true }).start();

  // ── Derived display state ───────────────────────────────────
  const current = engine.current;
  const challenge = current?.challenge ?? null;
  const displayText = current?.displayText ?? '';

  const progress = Math.min(1, Math.max(0.04, (current?.round ?? 1) / state.totalRounds));

  const isRuleStart = challenge?.isRule === true;
  const isRuleEnd = challenge?.isRule === false && challenge?.ruleId !== undefined;
  const modeColor = isRuleStart ? '#f5c842'
    : isRuleEnd ? '#72e88a'
    : (challenge ? (ModeColors[challenge.mode] || Colors.primary) : Colors.primary);
  const modeLabel = isRuleStart ? '📜 NEW RULE'
    : isRuleEnd ? '✅ RULE OVER'
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
        {/* Header: quit, avatars, round counter */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowQuitModal(true)}
            style={styles.quitBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={styles.avatarRow}>
            {state.players.slice(0, 5).map((p) => (
              <View key={p.id} style={[styles.avatar, { borderColor: p.color }]}>
                {p.photo ? (
                  <Image source={{ uri: p.photo }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarInitial, { color: p.color }]}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            ))}
            {state.players.length > 5 && (
              <View style={[styles.avatar, { borderColor: Colors.outline }]}>
                <Text style={styles.avatarInitial}>+{state.players.length - 5}</Text>
              </View>
            )}
          </View>

          <View style={styles.roundBadge}>
            <Text style={styles.roundText}>
              {Math.min(current?.round ?? 1, state.totalRounds)}/{state.totalRounds}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: modeColor }]} />
        </View>

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            { borderColor: `${modeColor}30` },
            { opacity: cardOpacity, transform: [{ translateX: cardTranslate }, { scale: cardScale }] },
          ]}
        >
          <View style={[styles.modeChip, { backgroundColor: `${modeColor}1c`, borderColor: `${modeColor}40` }]}>
            <Ionicons name={(challenge?.icon as any) || 'sparkles'} size={14} color={modeColor} />
            <Text style={[styles.modeChipText, { color: modeColor }]}>{modeLabel}</Text>
          </View>

          <Text style={styles.challengeText}>{displayText}</Text>

          {challenge?.action ? (
            <View style={styles.actionRow}>
              <View style={[styles.actionDot, { backgroundColor: modeColor }]} />
              <Text style={[styles.actionText, { color: modeColor }]}>{challenge.action}</Text>
            </View>
          ) : null}

          <View style={styles.watermark} pointerEvents="none">
            <Ionicons
              name={(challenge?.icon as any) || 'game-controller'}
              size={200}
              color={Colors.onSurface}
              style={{ opacity: 0.03 }}
            />
          </View>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable onPress={handleNext} onPressIn={pressIn} onPressOut={pressOut}>
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>
                  {canEnd ? 'FINISH GAME' : 'NEXT CHALLENGE'}
                </Text>
                <Ionicons
                  name={canEnd ? 'flag' : 'arrow-forward'}
                  size={20}
                  color={Colors.onPrimary}
                />
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.secondaryBtn, !engine.canGoBack && styles.secondaryBtnDisabled]}
              activeOpacity={0.7}
              disabled={!engine.canGoBack}
            >
              <Ionicons
                name="arrow-undo"
                size={18}
                color={engine.canGoBack ? Colors.outline : Colors.outlineVariant}
              />
              <Text style={[styles.secondaryText, !engine.canGoBack && styles.secondaryTextDisabled]}>
                Back
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryDivider} />

            <TouchableOpacity onPress={handleSkip} style={styles.secondaryBtn} activeOpacity={0.7}>
              <Ionicons name="play-skip-forward" size={18} color={Colors.outline} />
              <Text style={styles.secondaryText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quit confirm */}
      <Modal visible={showQuitModal} transparent animationType="slide" onRequestClose={() => setShowQuitModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Quit the game?</Text>
            <Text style={styles.modalSubtitle}>Progress will be lost.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setShowQuitModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalKeepText}>Keep playing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalQuitBtn}
                onPress={() => { setShowQuitModal(false); navigation.replace('Play'); }}
                activeOpacity={0.85}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  inner: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,
  },
  quitBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${Colors.onSurface}0a`,
  },
  avatarRow: { flexDirection: 'row', paddingLeft: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2, marginLeft: -10,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 13, color: Colors.onSurfaceVariant,
  },
  roundBadge: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    backgroundColor: `${Colors.onSurface}0a`,
  },
  roundText: {
    fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },

  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: `${Colors.onSurface}10`, marginBottom: 18,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  card: {
    flex: 1, borderRadius: 28, borderWidth: 1, padding: 26,
    backgroundColor: `${Colors.onSurface}06`, justifyContent: 'center',
    overflow: 'hidden',
  },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1,
    marginBottom: 22,
  },
  modeChipText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 12, letterSpacing: 1.2,
  },
  challengeText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 26, lineHeight: 35,
    color: Colors.onSurface,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22 },
  actionDot: { width: 6, height: 6, borderRadius: 3 },
  actionText: {
    fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
  },
  watermark: { position: 'absolute', bottom: -40, right: -40 },

  actions: { paddingTop: 18, gap: 4 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 58, borderRadius: 29,
  },
  nextBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16, letterSpacing: 1.2,
    color: Colors.onPrimary,
  },
  secondaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  secondaryBtnDisabled: { opacity: 0.5 },
  secondaryText: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 14, color: Colors.outline },
  secondaryTextDisabled: { color: Colors.outlineVariant },
  secondaryDivider: { width: 1, height: 16, backgroundColor: `${Colors.onSurface}15` },

  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: `${Colors.onSurface}12`,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: Colors.onSurface,
  },
  modalSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 14, color: Colors.onSurfaceVariant,
    marginTop: 6, marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalKeepBtn: {
    flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  modalKeepText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15, color: Colors.onPrimary,
  },
  modalQuitBtn: {
    flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${Colors.onSurface}20`,
  },
  modalQuitText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 15, color: Colors.onSurfaceVariant,
  },
});