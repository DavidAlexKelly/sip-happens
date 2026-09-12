// src/screens/RingSetEditorScreen.tsx
// Edit one Ring of Fire rule set: pick a mechanic and write the wording for
// each of the 13 ranks.
//
// The mechanic picker is where the invariants bite, so problems are shown
// inline and Save is blocked until the set is playable. Better to refuse than
// to let someone build a game that can never end.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, PlayerColors, Type } from '../styles/theme';
import { RANKS, rankLabel, rankName } from '../data/playingCards';
import {
  CLASSIC_SET, MECHANICS, RingMechanic, RingRuleEntry, RingRuleSet,
  duplicateSet, mechanicSpec, validateRuleSet, withEntry,
} from '../data/ringSets';
import { loadCustomSets, saveCustomSets } from '../data/ringSetStorage';
import { JackButton, JackIconButton } from '../components/jack';

type Props = NativeStackScreenProps<RootStackParamList, 'RingSetEditor'>;

export default function RingSetEditorScreen({ navigation, route }: Props) {
  const { setId } = route.params;
  const [set, setSet] = useState<RingRuleSet | null>(null);
  const [editingRank, setEditingRank] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const custom = await loadCustomSets();
      const found = custom.find(s => s.id === setId);
      // Editing the built-in set duplicates it instead — it must stay pristine
      // as the fallback for a corrupt or unplayable custom set.
      setSet(found ?? duplicateSet(CLASSIC_SET, setId, 'My Rules'));
    })();
  }, [setId]);

  if (!set) {
    return <SafeAreaView style={styles.container} edges={['top', 'bottom']} />;
  }

  const problems = validateRuleSet(set);
  const entry = editingRank != null
    ? set.entries.find(e => e.rank === editingRank)
    : undefined;

  const update = (next: RingRuleEntry) => setSet(s => (s ? withEntry(s, next) : s));

  const handleSave = async () => {
    if (problems.length > 0) return;
    const custom = await loadCustomSets();
    const next = custom.some(s => s.id === set.id)
      ? custom.map(s => (s.id === set.id ? set : s))
      : [...custom, set];
    await saveCustomSets(next);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <JackIconButton icon="arrow-back" onPress={() => navigation.goBack()} size={42} />
        <Text style={styles.headerTitle}>EDIT RULES</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>SET NAME</Text>
        <View style={styles.inputOuter}>
          <View style={styles.inputShadow} />
          <TextInput
            style={styles.input}
            value={set.name}
            onChangeText={(v: string) => setSet(s => (s ? { ...s, name: v } : s))}
            placeholder="My Rules"
            placeholderTextColor={Colors.outline}
            maxLength={30}
          />
        </View>

        <Text style={styles.label}>CARDS</Text>
        <View style={styles.rankList}>
          {RANKS.map(rank => {
            const e = set.entries.find(x => x.rank === rank);
            if (!e) return null;
            const spec = mechanicSpec(e.mechanic);
            return (
              <TouchableOpacity
                key={rank}
                activeOpacity={0.85}
                onPress={() => setEditingRank(rank)}
                style={styles.rankRow}
              >
                <View style={[styles.rankChip, { backgroundColor: e.color }]}>
                  <Text style={styles.rankChipText}>{rankLabel(rank)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankTitle}>{e.title}</Text>
                  <Text style={styles.rankMech}>{spec.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={Colors.outline} />
              </TouchableOpacity>
            );
          })}
        </View>

        {problems.length > 0 && (
          <View style={styles.problems}>
            <Text style={styles.problemsTitle}>Not playable yet</Text>
            {problems.map(p => (
              <Text key={p} style={styles.problemLine}>· {p}</Text>
            ))}
          </View>
        )}

        <View style={styles.save}>
          <JackButton
            label={problems.length > 0 ? 'Fix the problems above' : 'Save Set'}
            icon={problems.length > 0 ? undefined : 'checkmark'}
            disabled={problems.length > 0}
            onPress={handleSave}
          />
        </View>
      </ScrollView>

      {/* Per-rank editor */}
      <Modal
        visible={entry !== undefined}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingRank(null)}
      >
        <View style={styles.overlay}>
          {entry && (
            <View style={styles.sheet}>
              <View style={styles.sheetHead}>
                <Text style={styles.sheetTitle}>{rankName(entry.rank)}</Text>
                <TouchableOpacity
                  onPress={() => setEditingRank(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>WHAT IT DOES</Text>
                <View style={styles.mechList}>
                  {MECHANICS.map(m => {
                    const active = entry.mechanic === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        activeOpacity={0.85}
                        onPress={() => update({ ...entry, mechanic: m.id as RingMechanic })}
                        style={[
                          styles.mechRow,
                          active
                            ? { borderColor: Colors.primary, backgroundColor: Colors.surfaceContainerHigh }
                            : { borderColor: Colors.outlineVariant },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.mechLabel}>{m.label}</Text>
                          <Text style={styles.mechBlurb}>{m.blurb}</Text>
                        </View>
                        {active && (
                          <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>TITLE</Text>
                <View style={styles.inputOuter}>
                  <View style={styles.inputShadow} />
                  <TextInput
                    style={styles.input}
                    value={entry.title}
                    onChangeText={(v: string) => update({ ...entry, title: v })}
                    maxLength={24}
                    placeholder="WATERFALL"
                    placeholderTextColor={Colors.outline}
                  />
                </View>

                <Text style={styles.label}>INSTRUCTION</Text>
                <View style={styles.inputOuter}>
                  <View style={styles.inputShadow} />
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    value={entry.instruction}
                    onChangeText={(v: string) => update({ ...entry, instruction: v })}
                    maxLength={240}
                    multiline
                    textAlignVertical="top"
                    placeholder="What the table has to do."
                    placeholderTextColor={Colors.outline}
                  />
                </View>

                <Text style={styles.label}>COLOUR</Text>
                <View style={styles.colorRow}>
                  {PlayerColors.map(color => (
                    <TouchableOpacity
                      key={color}
                      activeOpacity={0.85}
                      onPress={() => update({ ...entry, color })}
                      style={[
                        styles.colorChip,
                        { backgroundColor: color },
                        entry.color === color && styles.colorChipActive,
                      ]}
                    >
                      {entry.color === color && (
                        <Ionicons name="checkmark" size={14} color={Colors.ink} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <JackButton label="Done" size="medium" onPress={() => setEditingRank(null)} />
            </View>
          )}
        </View>
      </Modal>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 36 },

  label: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 1.5,
    color: Colors.outline, marginTop: 20, marginBottom: 8,
  },

  inputOuter: { position: 'relative' },
  inputShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  input: {
    minHeight: 48, borderRadius: Jack.radius, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 4, backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
    borderWidth: Jack.border, borderColor: Colors.ink,
  },
  inputMulti: { minHeight: 92 },

  rankList: { gap: 8 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow, padding: 10,
  },
  rankChip: {
    width: 32, height: 42, borderRadius: 8,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  rankChipText: { fontFamily: Type.display, fontSize: 14, color: Colors.ink },
  rankTitle: { fontFamily: Type.display, fontSize: 13.5, color: Colors.onSurface },
  rankMech: {
    fontFamily: Type.bodyMedium, fontSize: 11.5,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },

  problems: {
    marginTop: 22, backgroundColor: Colors.errorContainer,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.error,
    padding: 14, gap: 4,
  },
  problemsTitle: { fontFamily: Type.display, fontSize: 13, color: Colors.onSurface },
  problemLine: {
    fontFamily: Type.body, fontSize: 12.5, lineHeight: 18, color: Colors.onSurfaceVariant,
  },

  save: { marginTop: 24 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,6,32,0.72)' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
    padding: 22, paddingBottom: 32, gap: 10, maxHeight: '92%',
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sheetTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface },
  sheetScroll: { maxHeight: 460 },

  mechList: { gap: 7 },
  mechRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: Jack.radius, borderWidth: 2.5,
    backgroundColor: Colors.surfaceContainerLow, padding: 11,
  },
  mechLabel: { fontFamily: Type.display, fontSize: 13, color: Colors.onSurface },
  mechBlurb: {
    fontFamily: Type.body, fontSize: 11.5, lineHeight: 16,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorChip: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  colorChipActive: { borderWidth: 4 },
});
