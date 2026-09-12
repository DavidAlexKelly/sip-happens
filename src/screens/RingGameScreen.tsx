// src/screens/RingGameScreen.tsx
// The Ring of Fire loop: draw a card, do what it says, pass on.
//
// The header is the point of this mode — it carries the state a drunk table
// forgets: who holds each role, how many Kings are left, and every house rule
// a Jack has created.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Modal, ScrollView,
  BackHandler, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { KINGS_IN_DECK, ruleHeading } from '../data/ringData';
import { cardName } from '../data/playingCards';
import { useGame } from '../components/GameContext';
import { useRing } from '../components/RingContext';
import { useRingEngine } from '../hooks/useRingEngine';
import { CLASSIC_SET, RingRuleSet } from '../data/ringSets';
import { loadActiveSet } from '../data/ringSetStorage';
import PlayingCard from '../components/PlayingCard';
import DealtGrid from '../components/DealtGrid';
import { Ads } from '../monetization/ads';
import { JackButton } from '../components/jack';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RingGame'>;
};

const MIDPOINT_CARDS = 14;

export default function RingGameScreen({ navigation }: Props) {
  const { state: game } = useGame();
  const { settings } = useRing();

  // loadActiveSet falls back to the classic set if the stored one has become
  // unplayable, so the engine can never be handed a set with a missing rank.
  const [ruleSet, setRuleSet] = useState<RingRuleSet>(CLASSIC_SET);
  useEffect(() => {
    let cancelled = false;
    loadActiveSet().then(s => { if (!cancelled) setRuleSet(s); });
    return () => { cancelled = true; };
  }, []);

  const engine = useRingEngine({
    players: game.players,
    endOnLastKing: settings.endOnLastKing,
    ruleSet,
  });

  const [showQuit, setShowQuit] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showRing, setShowRing] = useState(false);
  const [ruleDraft, setRuleDraft] = useState('');
  const midpointAdShown = useRef(false);
  const endHandled = useRef(false);

  const fade = useRef(new Animated.Value(1)).current;
  const fadeIn = useCallback(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [fade]);

  // Android back → quit sheet.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowQuit(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  // Game over is driven off engine state: it can arrive from the last King,
  // the deck running out, or a manual quit.
  useEffect(() => {
    if (!engine.isOver || endHandled.current) return;
    endHandled.current = true;
    engine.finishGame();
    Ads.show(() => navigation.replace('RingOver'));
  }, [engine.isOver, engine, navigation]);

  const handleDraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    engine.draw();
    setRuleDraft('');
    fadeIn();
  };

  const handleContinue = () => {
    Haptics.selectionAsync();

    // Commit a pending house rule before moving on, so a typed rule is never
    // silently dropped by tapping Continue.
    if (engine.rule?.prompt === 'houseRule' && ruleDraft.trim().length > 0) {
      engine.recordRule(ruleDraft);
      setRuleDraft('');
    }

    // Don't queue a midpoint ad on the final card — the game-over effect shows
    // its own, and two in a row is wrong even with the cooldown.
    if (!engine.isFinalCard
      && !midpointAdShown.current
      && engine.drawnCards.length >= MIDPOINT_CARDS) {
      midpointAdShown.current = true;
      Ads.show(() => { engine.advance(); });
      return;
    }
    engine.advance();
  };

  const handlePickMate = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    engine.choose(id);
  };

  const player = engine.currentPlayer;
  const rule = engine.rule;
  const isLastKing = rule?.pours === true && engine.kingsLeft === 0;
  const accent = rule?.color ?? Colors.primary;

  // Continue is blocked while an 8 is waiting for a mate — otherwise the
  // pairing would be lost and the rule silently skipped.
  const blocked = engine.awaitingMate;

  if (!player) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No players</Text>
          <JackButton label="Back to Menu" onPress={() => navigation.replace('Play')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowQuit(true)}
            style={styles.quit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          {/* Kings remaining — the countdown to the glass. */}
          <View style={styles.kings}>
            {Array.from({ length: KINGS_IN_DECK }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.kingPip,
                  i < engine.kingsDrawn
                    ? { backgroundColor: Colors.error, borderColor: Colors.ink }
                    : { borderColor: Colors.outlineVariant },
                ]}
              />
            ))}
            <Text style={styles.kingsLabel}>KINGS</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowRing(true)}
            style={styles.deckBadge}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deckBadgeText}>{engine.deckRemaining}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Live roles ── */}
        <View style={styles.roleRow}>
          <RoleChip
            icon="thumbs-up"
            color={Colors.sky}
            name={engine.thumbMaster?.name}
            fallback="No thumb master"
          />
          <RoleChip
            icon="help-circle"
            color={Colors.grape}
            name={engine.questionMaster?.name}
            fallback="No question master"
          />
        </View>
        {engine.mateA && engine.mateB && (
          <View style={styles.mateBanner}>
            <Ionicons name="people" size={13} color={Colors.ink} />
            <Text style={styles.mateBannerText}>
              {engine.mateA.name} + {engine.mateB.name} drink together
            </Text>
          </View>
        )}

        {/* ── Card area ── */}
        {engine.phase === 'draw' && (
          <Pressable style={styles.stage} onPress={handleDraw}>
            <Text style={styles.turnEyebrow}>YOUR TURN</Text>
            <Text style={styles.turnName}>{player.name.toUpperCase()}</Text>
            <PlayingCard card={null} faceDown size="large" />
            <Text style={styles.tapHint}>Tap to draw</Text>
          </Pressable>
        )}

        {engine.phase === 'card' && rule && (
          <Animated.View style={[styles.stage, { opacity: fade }]}>
            <ScrollView
              contentContainerStyle={styles.cardScroll}
              showsVerticalScrollIndicator={false}
            >
              {isLastKing ? (
                <View style={styles.lastKing}>
                  <Text style={styles.lastKingEyebrow}>THE LAST KING</Text>
                  <Text style={styles.lastKingName}>
                    {player.name.toUpperCase()}
                  </Text>
                  <Text style={styles.lastKingBody}>
                    Drink everything in the glass.
                  </Text>
                </View>
              ) : (
                <Text style={styles.drawerLine}>
                  {player.name} drew the {cardName(engine.card!)}
                </Text>
              )}

              <PlayingCard card={engine.card} size="medium" />

              <View style={styles.ruleOuter}>
                <View style={[styles.ruleShadow, { backgroundColor: accent }]} />
                <View style={styles.ruleFace}>
                  <View style={[styles.ruleBadge, { backgroundColor: accent }]}>
                    <Ionicons name={rule.icon as never} size={14} color={Colors.ink} />
                    <Text style={styles.ruleBadgeText}>{rule.title}</Text>
                  </View>
                  <Text style={styles.ruleHeading}>{ruleHeading(rule)}</Text>
                  <Text style={styles.ruleBody}>{rule.instruction}</Text>

                  {engine.suggestion && (
                    <View style={styles.suggestion}>
                      <Text style={styles.suggestionLabel}>
                        {rule.prompt === 'category' ? 'SUGGESTION' : 'START WITH'}
                      </Text>
                      <Text style={styles.suggestionText}>{engine.suggestion}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 8 — pick a mate */}
              {engine.awaitingMate && (
                <View style={styles.pickWrap}>
                  <Text style={styles.pickLabel}>PICK YOUR MATE</Text>
                  <View style={styles.pickGrid}>
                    {game.players
                      .filter(p => p.id !== player.id)
                      .map(p => (
                        <TouchableOpacity
                          key={p.id}
                          activeOpacity={0.85}
                          onPress={() => handlePickMate(p.id)}
                          style={[styles.pickChip, { borderColor: p.color }]}
                        >
                          <Text style={styles.pickChipText}>{p.name}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}

              {/* Jack — record the rule */}
              {rule.prompt === 'houseRule' && (
                <View style={styles.pickWrap}>
                  <Text style={styles.pickLabel}>WRITE IT DOWN (OPTIONAL)</Text>
                  <View style={styles.inputOuter}>
                    <View style={styles.inputShadow} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. No swearing"
                      placeholderTextColor={Colors.outline}
                      value={ruleDraft}
                      onChangeText={setRuleDraft}
                      maxLength={60}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (ruleDraft.trim()) { engine.recordRule(ruleDraft); setRuleDraft(''); }
                      }}
                    />
                  </View>
                  <Text style={styles.pickHint}>
                    Saved rules show in the header so nobody can claim they forgot.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          {engine.houseRules.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowRules(true)}
              style={styles.rulesPill}
              activeOpacity={0.8}
            >
              <Ionicons name="construct" size={13} color={Colors.primary} />
              <Text style={styles.rulesPillText}>
                {engine.houseRules.length} HOUSE RULE
                {engine.houseRules.length === 1 ? '' : 'S'}
              </Text>
            </TouchableOpacity>
          )}

          {engine.phase === 'card' && (
            <JackButton
              label={
                blocked ? 'Pick a mate first'
                  : engine.isFinalCard ? 'See the Damage'
                  : 'Next Player'
              }
              icon={blocked ? undefined : 'arrow-forward'}
              color={isLastKing ? Colors.error : Colors.primary}
              disabled={blocked}
              onPress={handleContinue}
              haptic={false}
            />
          )}
        </View>
      </View>

      {/* ── House rules sheet ── */}
      <Modal visible={showRules} transparent animationType="slide"
        onRequestClose={() => setShowRules(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>House Rules</Text>
            <ScrollView style={styles.sheetScroll}>
              {engine.houseRules.map((r, i) => {
                const by = game.players.find(p => p.id === r.byPlayerId);
                return (
                  <View key={r.id} style={styles.houseRuleRow}>
                    <Text style={styles.houseRuleNum}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.houseRuleText}>{r.text}</Text>
                      {by && <Text style={styles.houseRuleBy}>set by {by.name}</Text>}
                    </View>
                    <TouchableOpacity
                      onPress={() => engine.dropRule(r.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.outline} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            <JackButton label="Close" size="medium" variant="ghost"
              onPress={() => setShowRules(false)} />
          </View>
        </View>
      </Modal>

      {/* ── The ring ── */}
      <Modal visible={showRing} transparent animationType="slide"
        onRequestClose={() => setShowRing(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>The Ring</Text>
            <Text style={styles.sheetSub}>
              {engine.drawnCards.length} drawn · {engine.deckRemaining} left
            </Text>
            <ScrollView style={styles.sheetScroll}>
              <DealtGrid cards={engine.drawnCards} />
            </ScrollView>
            <JackButton label="Close" size="medium" variant="ghost"
              onPress={() => setShowRing(false)} />
          </View>
        </View>
      </Modal>

      {/* ── Quit ── */}
      <Modal visible={showQuit} transparent animationType="slide"
        onRequestClose={() => setShowQuit(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Leave the ring?</Text>
            <Text style={styles.sheetSub}>
              End here and see the damage, or drop out entirely.
            </Text>
            <View style={styles.sheetBtns}>
              <View style={{ flex: 1 }}>
                <JackButton label="Keep Playing" size="medium"
                  onPress={() => setShowQuit(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <JackButton
                  label="End Game"
                  size="medium"
                  variant="ghost"
                  onPress={() => { setShowQuit(false); engine.quit(); }}
                />
              </View>
            </View>
            <JackButton label="Quit to Menu" size="small" variant="ghost"
              onPress={() => { setShowQuit(false); navigation.replace('Play'); }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RoleChip({ icon, color, name, fallback }: {
  icon: string; color: string; name?: string; fallback: string;
}) {
  const held = !!name;
  return (
    <View style={[
      styles.roleChip,
      held ? { borderColor: color } : { borderColor: Colors.outlineVariant },
    ]}>
      <Ionicons
        name={icon as never}
        size={13}
        color={held ? color : Colors.outlineVariant}
      />
      <Text style={[styles.roleChipText, !held && { color: Colors.outline }]}>
        {held ? name : fallback}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 20, paddingBottom: 10 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10,
  },
  quit: {
    width: 36, height: 36, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  kings: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kingPip: {
    width: 12, height: 12, borderRadius: 6, borderWidth: 2,
    backgroundColor: Colors.surfaceContainerLow,
  },
  kingsLabel: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 1.5,
    color: Colors.outline, marginLeft: 4,
  },
  deckBadge: {
    minWidth: 36, height: 36, paddingHorizontal: 8, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  deckBadgeText: {
    fontFamily: Type.display, fontSize: 12, color: Colors.onSurfaceVariant,
  },

  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  roleChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, borderWidth: 2, paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: Colors.surfaceContainerLow,
  },
  roleChipText: {
    fontFamily: Type.bodyBold, fontSize: 11, color: Colors.onSurface, flexShrink: 1,
  },
  mateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.lime, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.ink,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10,
  },
  mateBannerText: { fontFamily: Type.display, fontSize: 10.5, color: Colors.ink },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  cardScroll: { alignItems: 'center', gap: 16, paddingVertical: 8 },
  turnEyebrow: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 2.5, color: Colors.outline,
  },
  turnName: { fontFamily: Type.display, fontSize: 32, color: Colors.onSurface },
  tapHint: {
    fontFamily: Type.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant,
  },
  drawerLine: {
    fontFamily: Type.bodyBold, fontSize: 13, color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  lastKing: { alignItems: 'center', gap: 2 },
  lastKingEyebrow: {
    fontFamily: Type.display, fontSize: 12, letterSpacing: 2.5, color: Colors.error,
  },
  lastKingName: { fontFamily: Type.display, fontSize: 34, color: Colors.onSurface },
  lastKingBody: {
    fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 2,
  },

  ruleOuter: { position: 'relative', alignSelf: 'stretch' },
  ruleShadow: {
    position: 'absolute', top: Jack.shadow, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radiusBig,
  },
  ruleFace: {
    borderRadius: Jack.radiusBig, borderWidth: Jack.border, borderColor: Colors.ink,
    backgroundColor: Colors.paper, padding: 18, marginBottom: Jack.shadow, gap: 8,
  },
  ruleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: 9, borderWidth: 2.5, borderColor: Colors.ink,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  ruleBadgeText: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 1, color: Colors.ink,
  },
  ruleHeading: { fontFamily: Type.display, fontSize: 19, color: Colors.ink },
  ruleBody: {
    fontFamily: Type.body, fontSize: 14, lineHeight: 21, color: Colors.inkMuted,
  },
  suggestion: {
    borderTopWidth: 2, borderTopColor: Colors.paperDim, paddingTop: 10, marginTop: 2,
  },
  suggestionLabel: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 1.5, color: Colors.onPaperDim,
  },
  suggestionText: {
    fontFamily: Type.display, fontSize: 17, color: Colors.ink, marginTop: 2,
  },

  pickWrap: { alignSelf: 'stretch', gap: 8 },
  pickLabel: {
    fontFamily: Type.display, fontSize: 10, letterSpacing: 2, color: Colors.outline,
  },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickChip: {
    borderRadius: 10, borderWidth: 2.5, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: Colors.surfaceContainerLow,
  },
  pickChipText: { fontFamily: Type.display, fontSize: 13, color: Colors.onSurface },
  pickHint: { fontFamily: Type.body, fontSize: 11.5, color: Colors.outline },

  inputOuter: { position: 'relative' },
  inputShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  input: {
    height: 48, borderRadius: Jack.radius, paddingHorizontal: 14, marginBottom: 4,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
    borderWidth: Jack.border, borderColor: Colors.ink,
  },

  footer: { paddingTop: 10, gap: 10 },
  rulesPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  rulesPillText: {
    fontFamily: Type.display, fontSize: 10, letterSpacing: 1.2, color: Colors.primary,
  },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,6,32,0.72)' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
    padding: 22, paddingBottom: 34, gap: 12,
  },
  sheetTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface },
  sheetSub: {
    fontFamily: Type.body, fontSize: 13, color: Colors.onSurfaceVariant,
  },
  sheetScroll: { maxHeight: 320 },
  sheetBtns: { flexDirection: 'row', gap: 12 },

  houseRuleRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8,
    borderBottomWidth: 2, borderBottomColor: Colors.outlineVariant,
  },
  houseRuleNum: {
    fontFamily: Type.display, fontSize: 13, color: Colors.primary, width: 18,
  },
  houseRuleText: { fontFamily: Type.bodyBold, fontSize: 13.5, color: Colors.onSurface },
  houseRuleBy: {
    fontFamily: Type.body, fontSize: 11, color: Colors.outline, marginTop: 2,
  },
});
