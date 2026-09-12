// src/screens/RingSetupScreen.tsx
// Setup for Ring of Fire. There is only one real choice — whether the game
// ends on the last King — so the rest of the screen is the rule table, which
// is genuinely useful when half the group has never played.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { RING_RULES, ruleHeading } from '../data/ringData';
import { rankLabel } from '../data/playingCards';
import { useRing } from '../components/RingContext';
import { RingRuleSet, isPlayable } from '../data/ringSets';
import { loadAllSets } from '../data/ringSetStorage';
import { JackButton, JackIconButton } from '../components/jack';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RingSetup'>;
};

export default function RingSetupScreen({ navigation }: Props) {
  const { settings, setEndOnLastKing, activeSetId, setActiveSetId } = useRing();

  const [sets, setSets] = useState<RingRuleSet[]>([]);
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    loadAllSets().then(s => { if (!cancelled) setSets(s); });
    return () => { cancelled = true; };
  }, []));

  const tap = (fn: () => void) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <JackIconButton icon="arrow-back" onPress={() => navigation.goBack()} size={42} />
        <Text style={styles.headerTitle}>RING OF FIRE</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            RING OF{'\n'}<Text style={styles.pageTitleAccent}>FIRE</Text>
          </Text>
          <Text style={styles.pageSubtitle}>
            Spread the cards, put a glass in the middle. Draw one each and do
            what it says. Whoever draws the last King drinks the glass.
          </Text>
        </View>

        {/* ── The one setting ── */}
        <Text style={styles.sectionLabel}>HOW IT ENDS</Text>
        <View style={styles.rowOuter}>
          <View style={styles.rowShadow} />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={tap(() => setEndOnLastKing(true))}
            style={[
              styles.rowFace,
              settings.endOnLastKing
                ? { borderColor: Colors.error, backgroundColor: Colors.surfaceContainerHigh }
                : { borderColor: Colors.ink, backgroundColor: Colors.surfaceContainerLow },
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: Colors.error }]}>
              <Ionicons name="beer" size={18} color={Colors.ink} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Last King ends it</Text>
              <Text style={styles.rowMeta}>Classic. Usually 20–40 cards.</Text>
            </View>
            <View style={[
              styles.radio,
              settings.endOnLastKing
                ? { backgroundColor: Colors.error, borderColor: Colors.ink }
                : { borderColor: Colors.outlineVariant },
            ]}>
              {settings.endOnLastKing && (
                <Ionicons name="checkmark" size={14} color={Colors.ink} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.rowOuter}>
          <View style={styles.rowShadow} />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={tap(() => setEndOnLastKing(false))}
            style={[
              styles.rowFace,
              !settings.endOnLastKing
                ? { borderColor: Colors.primary, backgroundColor: Colors.surfaceContainerHigh }
                : { borderColor: Colors.ink, backgroundColor: Colors.surfaceContainerLow },
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: Colors.primary }]}>
              <Ionicons name="albums" size={18} color={Colors.ink} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Play the whole deck</Text>
              <Text style={styles.rowMeta}>
                All 52. The last King still drinks the glass.
              </Text>
            </View>
            <View style={[
              styles.radio,
              !settings.endOnLastKing
                ? { backgroundColor: Colors.primary, borderColor: Colors.ink }
                : { borderColor: Colors.outlineVariant },
            ]}>
              {!settings.endOnLastKing && (
                <Ionicons name="checkmark" size={14} color={Colors.ink} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Rule sets ── */}
        <Text style={styles.sectionLabel}>RULE SET</Text>
        <View style={styles.setList}>
          {sets.map(s => {
            const active = s.id === activeSetId;
            const playable = isPlayable(s);
            return (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.9}
                onPress={tap(() => { if (playable) setActiveSetId(s.id); })}
                style={[
                  styles.setRow,
                  active && playable
                    ? { borderColor: Colors.primary, backgroundColor: Colors.surfaceContainerHigh }
                    : { borderColor: Colors.outlineVariant },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.setName}>{s.name}</Text>
                  <Text style={styles.setMeta}>
                    {s.builtIn ? 'Built-in' : 'Yours'}
                    {playable ? '' : ' · not playable yet'}
                  </Text>
                </View>
                {!s.builtIn && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('RingSetEditor', { setId: s.id })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="create-outline" size={17} color={Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                )}
                {active && playable && (
                  <Ionicons name="checkmark-circle" size={19} color={Colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.makeSet}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('RingSetEditor', { setId: `ring-set-${Date.now()}` })}
        >
          <Ionicons name="construct-outline" size={17} color={Colors.onSurface} />
          <Text style={styles.makeSetText}>Make your own rules</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.outline} />
        </TouchableOpacity>

        {/* ── The rule table ── */}
        <Text style={styles.sectionLabel}>THE CLASSIC RULES</Text>
        <View style={styles.ruleList}>
          {RING_RULES.map(rule => (
            <View key={rule.rank} style={styles.ruleRow}>
              <View style={[styles.rankChip, { backgroundColor: rule.color }]}>
                <Text style={styles.rankChipText}>{rankLabel(rule.rank)}</Text>
              </View>
              <View style={styles.ruleInfo}>
                <Text style={styles.ruleTitle}>{ruleHeading(rule)}</Text>
                <Text style={styles.ruleText}>{rule.instruction}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.hint}>
          The app remembers who the Thumb Master, Question Master and Mates are,
          and counts the Kings for you.
        </Text>

        <View style={styles.continue}>
          <JackButton
            label="Next — Add Players"
            icon="arrow-forward"
            onPress={() => navigation.navigate('Players', { next: 'RingGame' })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: Type.display, fontSize: 13, letterSpacing: 2,
    color: Colors.onSurfaceVariant,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  pageHeader: { marginTop: 4, marginBottom: 22 },
  pageTitle: { fontFamily: Type.display, fontSize: 36, lineHeight: 39, color: Colors.onSurface },
  pageTitleAccent: { color: Colors.error },
  pageSubtitle: {
    fontFamily: Type.body, fontSize: 14, lineHeight: 21,
    color: Colors.onSurfaceVariant, marginTop: 8,
  },

  sectionLabel: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 2,
    color: Colors.outline, marginTop: 24, marginBottom: 12,
  },

  rowOuter: { position: 'relative', marginBottom: 12 },
  rowShadow: {
    position: 'absolute', top: Jack.shadow, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  rowFace: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Jack.radius, borderWidth: Jack.border,
    padding: 12, marginBottom: Jack.shadow,
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: 10,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontFamily: Type.display, fontSize: 14, color: Colors.onSurface },
  rowMeta: {
    fontFamily: Type.bodyMedium, fontSize: 11.5,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },

  ruleList: { gap: 10 },
  ruleRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rankChip: {
    width: 34, height: 44, borderRadius: 8,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  rankChipText: { fontFamily: Type.display, fontSize: 15, color: Colors.ink },
  ruleInfo: { flex: 1 },
  ruleTitle: { fontFamily: Type.display, fontSize: 13, color: Colors.onSurface },
  ruleText: {
    fontFamily: Type.body, fontSize: 12.5, lineHeight: 18,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },

  hint: {
    fontFamily: Type.body, fontSize: 12.5, lineHeight: 18,
    color: Colors.outline, marginTop: 20,
  },
  setList: { gap: 8 },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Jack.radius, borderWidth: 2.5,
    backgroundColor: Colors.surfaceContainerLow, padding: 12,
  },
  setName: { fontFamily: Type.display, fontSize: 14, color: Colors.onSurface },
  setMeta: {
    fontFamily: Type.bodyMedium, fontSize: 11.5,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },
  makeSet: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 13, paddingHorizontal: 14,
  },
  makeSetText: { flex: 1, fontFamily: Type.bodyBold, fontSize: 13.5, color: Colors.onSurface },

  continue: { marginTop: 26 },
});
