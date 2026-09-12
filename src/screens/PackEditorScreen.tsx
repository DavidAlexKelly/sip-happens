// src/screens/PackEditorScreen.tsx
// Edit one pack: name, icon, colour, and which items are in it.
//
// The picker is the mix-and-match surface — your own items and the built-in
// ones side by side, toggled into the same list.

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, PlayerColors, Type } from '../styles/theme';
import { builtinRef, findPack, toggleInPack } from '../data/packs';
import { usePackLibrary } from '../hooks/usePackLibrary';
import { JackButton, JackIconButton } from '../components/jack';

type Props = NativeStackScreenProps<RootStackParamList, 'PackEditor'>;

const ICONS = [
  'layers', 'beer', 'flame', 'heart', 'skull', 'star', 'bulb', 'eye-off',
  'happy', 'wine', 'rocket', 'planet',
];

export default function PackEditorScreen({ navigation, route }: Props) {
  const { scope, packId } = route.params;
  const lib = usePackLibrary(scope);
  const { adapter } = lib;

  const pack = findPack(lib.packs, packId);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'mine' | 'builtin'>('mine');

  const mine = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lib.items
      .map(item => ({ ref: item.id, ...adapter.describe(item.payload) }))
      .filter(r => q.length === 0 || r.title.toLowerCase().includes(q)
        || r.subtitle.toLowerCase().includes(q));
  }, [lib.items, adapter, query]);

  // Same reason as ItemLibraryScreen: never call builtins() from render.
  const allBuiltins = useMemo(() => adapter.builtins(), [adapter]);

  const builtins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBuiltins
      .filter(b => q.length === 0 || b.title.toLowerCase().includes(q)
        || (b.subtitle ?? '').toLowerCase().includes(q))
      .map(b => ({ ref: builtinRef(b.id), title: b.title, subtitle: b.subtitle ?? '' }))
      // Keep the list workable — the built-in catalogues run to hundreds.
      .slice(0, 200);
  }, [allBuiltins, query]);

  if (!pack) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.missing}>
          <Text style={styles.missingText}>That {adapter.packNoun.toLowerCase()} no longer exists.</Text>
          <JackButton label="Back" size="medium" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const update = (next: typeof pack) => { lib.savePack(next); };

  const toggle = (ref: string) => {
    Haptics.selectionAsync();
    update(toggleInPack(pack, ref));
  };

  const rows = tab === 'mine' ? mine : builtins;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <JackIconButton icon="arrow-back" onPress={() => navigation.goBack()} size={42} />
        <Text style={styles.headerTitle}>EDIT {adapter.packNoun.toUpperCase()}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <Text style={styles.label}>NAME</Text>
        <View style={styles.inputOuter}>
          <View style={styles.inputShadow} />
          <TextInput
            style={styles.input}
            value={pack.name}
            onChangeText={(v: string) => update({ ...pack, name: v })}
            placeholder={`${adapter.packNoun} name`}
            placeholderTextColor={Colors.outline}
            maxLength={30}
          />
        </View>

        {/* Icon */}
        <Text style={styles.label}>ICON</Text>
        <View style={styles.chipWrap}>
          {ICONS.map(icon => (
            <TouchableOpacity
              key={icon}
              activeOpacity={0.85}
              onPress={() => update({ ...pack, icon })}
              style={[
                styles.iconChip,
                pack.icon === icon
                  ? { backgroundColor: pack.color, borderColor: Colors.ink }
                  : { borderColor: Colors.outlineVariant },
              ]}
            >
              <Ionicons
                name={icon as never}
                size={17}
                color={pack.icon === icon ? Colors.ink : Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Colour */}
        <Text style={styles.label}>COLOUR</Text>
        <View style={styles.chipWrap}>
          {PlayerColors.map(color => (
            <TouchableOpacity
              key={color}
              activeOpacity={0.85}
              onPress={() => update({ ...pack, color })}
              style={[
                styles.colorChip,
                { backgroundColor: color },
                pack.color === color && styles.colorChipActive,
              ]}
            >
              {pack.color === color && (
                <Ionicons name="checkmark" size={15} color={Colors.ink} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contents */}
        <View style={styles.contentsHead}>
          <Text style={styles.label}>
            IN THIS {adapter.packNoun.toUpperCase()} · {pack.itemIds.length}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ItemLibrary', { scope })}
            activeOpacity={0.8}
          >
            <Text style={styles.writeLink}>
              + Write a {adapter.itemNoun.toLowerCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={15} color={Colors.outline} />
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={Colors.outline}
          />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setTab('mine')}
            style={[styles.tab, tab === 'mine' && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
              MINE · {lib.items.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('builtin')}
            style={[styles.tab, tab === 'builtin' && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'builtin' && styles.tabTextActive]}>
              BUILT-IN
            </Text>
          </TouchableOpacity>
        </View>

        {rows.length === 0 && (
          <Text style={styles.emptyText}>
            {tab === 'mine'
              ? `No ${adapter.itemNounPlural.toLowerCase()} of your own yet.`
              : 'Nothing matches that search.'}
          </Text>
        )}

        <View style={styles.pickList}>
          {rows.map(row => {
            const inPack = pack.itemIds.includes(row.ref);
            return (
              <TouchableOpacity
                key={row.ref}
                activeOpacity={0.85}
                onPress={() => toggle(row.ref)}
                style={[
                  styles.pickRow,
                  inPack
                    ? { borderColor: pack.color, backgroundColor: Colors.surfaceContainerHigh }
                    : { borderColor: Colors.outlineVariant },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickTitle} numberOfLines={1}>{row.title}</Text>
                  {row.subtitle.length > 0 && (
                    <Text style={styles.pickSub} numberOfLines={2}>{row.subtitle}</Text>
                  )}
                </View>
                <View style={[
                  styles.check,
                  inPack
                    ? { backgroundColor: pack.color, borderColor: Colors.ink }
                    : { borderColor: Colors.outlineVariant },
                ]}>
                  {inPack && <Ionicons name="checkmark" size={14} color={Colors.ink} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'builtin' && builtins.length >= 200 && (
          <Text style={styles.emptyText}>
            Showing the first 200 — search to narrow it down.
          </Text>
        )}

        <View style={styles.done}>
          <JackButton label="Done" icon="checkmark" onPress={() => navigation.goBack()} />
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
  scroll: { paddingHorizontal: 20, paddingBottom: 36 },

  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  missingText: {
    fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center',
  },

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
    height: 48, borderRadius: Jack.radius, paddingHorizontal: 14, marginBottom: 4,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
    borderWidth: Jack.border, borderColor: Colors.ink,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconChip: {
    width: 42, height: 42, borderRadius: 11, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
  },
  colorChip: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  colorChipActive: { borderWidth: 4 },

  contentsHead: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  writeLink: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 0.5,
    color: Colors.primary, marginBottom: 8,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12,
    borderRadius: Jack.radius, borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  search: {
    flex: 1, height: 42, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
  },

  tabs: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.outlineVariant,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.ink },
  tabText: {
    fontFamily: Type.display, fontSize: 10, letterSpacing: 1,
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: { color: Colors.ink },

  pickList: { gap: 8 },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: Jack.radius, borderWidth: 2.5,
    backgroundColor: Colors.surfaceContainerLow, padding: 11,
  },
  pickTitle: { fontFamily: Type.bodyBold, fontSize: 13.5, color: Colors.onSurface },
  pickSub: {
    fontFamily: Type.body, fontSize: 11.5, lineHeight: 16,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },
  check: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Type.body, fontSize: 12.5, color: Colors.outline, paddingVertical: 10,
  },

  done: { marginTop: 24 },
});
