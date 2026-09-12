// src/components/PackSelector.tsx
// The "what's in play / edit content" block every setup screen shows.
//
// Keeps the three config hubs consistent: the same section, wording and
// affordances regardless of whether the content is cards, questions or words.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Jack, Type } from '../styles/theme';
import { Pack, livePackSize } from '../data/packs';
import { CustomItem } from '../data/packs';
import { LibraryScope, adapterFor } from '../data/scopes';

type Props = {
  scope: LibraryScope;
  packs: Pack[];
  items: CustomItem[];
  selectedIds: string[];
  onToggle: (packId: string) => void;
  onManage: () => void;
};

export default function PackSelector({
  scope, packs, items, selectedIds, onToggle, onManage,
}: Props) {
  const adapter = adapterFor(scope);

  const toggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(id);
  };

  return (
    <View>
      <Text style={styles.sectionLabel}>
        MY {adapter.packNounPlural.toUpperCase()}
      </Text>

      {packs.length === 0 ? (
        <Text style={styles.empty}>
          You have no {adapter.packNounPlural.toLowerCase()} yet. Make one to mix
          your own {adapter.itemNounPlural.toLowerCase()} with the built-in ones.
        </Text>
      ) : (
        <View style={styles.list}>
          {packs.map(pack => {
            const selected = selectedIds.includes(pack.id);
            const size = livePackSize(pack, items);
            return (
              <View key={pack.id} style={styles.rowOuter}>
                <View
                  style={[
                    styles.rowShadow,
                    { backgroundColor: selected ? pack.color : Colors.ink },
                  ]}
                />
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => toggle(pack.id)}
                  style={[
                    styles.rowFace,
                    selected
                      ? { borderColor: pack.color, backgroundColor: Colors.surfaceContainerHigh }
                      : { borderColor: Colors.ink, backgroundColor: Colors.surfaceContainerLow },
                  ]}
                >
                  <View style={[styles.icon, { backgroundColor: pack.color }]}>
                    <Ionicons name={pack.icon as never} size={17} color={Colors.ink} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{pack.name}</Text>
                    <Text style={styles.meta}>
                      {size} {size === 1
                        ? adapter.itemNoun.toLowerCase()
                        : adapter.itemNounPlural.toLowerCase()}
                      {size === 0 ? ' — add some to use it' : ''}
                    </Text>
                  </View>
                  <View style={[
                    styles.check,
                    selected
                      ? { backgroundColor: pack.color, borderColor: Colors.ink }
                      : { borderColor: Colors.outlineVariant },
                  ]}>
                    {selected && <Ionicons name="checkmark" size={14} color={Colors.ink} />}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.manage} activeOpacity={0.85} onPress={onManage}>
        <Ionicons name="create-outline" size={17} color={Colors.onSurface} />
        <Text style={styles.manageText}>
          Edit my {adapter.packNounPlural.toLowerCase()} &amp;{' '}
          {adapter.itemNounPlural.toLowerCase()}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.outline} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: Type.display, fontSize: 11, letterSpacing: 2,
    color: Colors.outline, marginTop: 24, marginBottom: 12,
  },
  empty: {
    fontFamily: Type.body, fontSize: 12.5, lineHeight: 18, color: Colors.outline,
  },
  list: { gap: 10 },

  rowOuter: { position: 'relative' },
  rowShadow: {
    position: 'absolute', top: Jack.shadow, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius,
  },
  rowFace: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Jack.radius, borderWidth: Jack.border,
    padding: 11, marginBottom: Jack.shadow,
  },
  icon: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontFamily: Type.display, fontSize: 14, color: Colors.onSurface },
  meta: {
    fontFamily: Type.bodyMedium, fontSize: 11.5,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },
  check: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
  },

  manage: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 13, paddingHorizontal: 14,
  },
  manageText: { flex: 1, fontFamily: Type.bodyBold, fontSize: 13.5, color: Colors.onSurface },
});
