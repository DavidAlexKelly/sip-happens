// src/screens/ItemLibraryScreen.tsx
// One screen for every mode's authored content: "My Cards", "My Questions",
// "My Words". Everything mode-specific comes from the scope adapter, so this
// file has no knowledge of cards, questions or words.

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { usePackLibrary } from '../hooks/usePackLibrary';
import { FormValues } from '../data/scopes/types';
import ItemForm from '../components/ItemForm';
import { JackButton, JackIconButton } from '../components/jack';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemLibrary'>;

export default function ItemLibraryScreen({ navigation, route }: Props) {
  const { scope } = route.params;
  const lib = usePackLibrary(scope);
  const { adapter } = lib;

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);  // item id, or 'new'
  const [form, setForm] = useState<FormValues>(adapter.emptyForm());
  const [problem, setProblem] = useState<string | null>(null);
  const [showBuiltins, setShowBuiltins] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lib.items
      .map(item => ({ item, ...adapter.describe(item.payload) }))
      .filter(r => q.length === 0
        || r.title.toLowerCase().includes(q)
        || r.subtitle.toLowerCase().includes(q))
      .sort((a, b) => b.item.createdAt - a.item.createdAt);
  }, [lib.items, adapter, query]);

  const builtinRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adapter.builtins().filter(b => q.length === 0
      || b.title.toLowerCase().includes(q)
      || (b.subtitle ?? '').toLowerCase().includes(q));
  }, [adapter, query]);

  const openNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setForm(adapter.emptyForm());
    setProblem(null);
    setEditing('new');
  };

  const openEdit = (id: string) => {
    const item = lib.items.find(i => i.id === id);
    if (!item) return;
    setForm(adapter.formFromPayload(item.payload));
    setProblem(null);
    setEditing(id);
  };

  const handleSave = async () => {
    const err = await lib.saveItem(form, editing === 'new' ? undefined : editing ?? undefined);
    if (err) { setProblem(err); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditing(null);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      `Delete this ${adapter.itemNoun.toLowerCase()}?`,
      `"${title}" will also be removed from any ${adapter.packNounPlural.toLowerCase()} that use it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { lib.deleteItem(id); },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <JackIconButton icon="arrow-back" onPress={() => navigation.goBack()} size={42} />
        <Text style={styles.headerTitle}>MY {adapter.itemNounPlural.toUpperCase()}</Text>
        <JackIconButton
          icon="add"
          onPress={openNew}
          color={Colors.primary}
          iconColor={Colors.ink}
          size={42}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={15} color={Colors.outline} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${adapter.itemNounPlural.toLowerCase()}`}
          placeholderTextColor={Colors.outline}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Tab
          label={`MINE · ${lib.items.length}`}
          active={!showBuiltins}
          onPress={() => setShowBuiltins(false)}
        />
        <Tab
          label={`BUILT-IN · ${adapter.builtins().length}`}
          active={showBuiltins}
          onPress={() => setShowBuiltins(true)}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {!showBuiltins && rows.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="create-outline" size={38} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>
              {lib.items.length === 0
                ? `No ${adapter.itemNounPlural.toLowerCase()} yet. Tap + to write one.`
                : 'Nothing matches that search.'}
            </Text>
          </View>
        )}

        {!showBuiltins && rows.map(({ item, title, subtitle }) => (
          <View key={item.id} style={styles.rowOuter}>
            <View style={styles.rowShadow} />
            <View style={styles.rowFace}>
              <TouchableOpacity
                style={styles.rowMain}
                activeOpacity={0.8}
                onPress={() => openEdit(item.id)}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.rowSub} numberOfLines={2}>{subtitle}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, title)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={17} color={Colors.onPaperDim} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {showBuiltins && builtinRows.map(b => (
          <View key={b.id} style={styles.builtinRow}>
            {b.group && <Text style={styles.builtinGroup}>{b.group}</Text>}
            <Text style={styles.rowTitle} numberOfLines={1}>{b.title}</Text>
            {b.subtitle && <Text style={styles.rowSub} numberOfLines={2}>{b.subtitle}</Text>}
          </View>
        ))}

        {showBuiltins && (
          <Text style={styles.builtinHint}>
            Built-in {adapter.itemNounPlural.toLowerCase()} are read-only, but you
            can mix them into your own {adapter.packNounPlural.toLowerCase()}.
          </Text>
        )}
      </ScrollView>

      {/* Editor */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>
                {editing === 'new' ? `New ${adapter.itemNoun}` : `Edit ${adapter.itemNoun}`}
              </Text>
              <TouchableOpacity
                onPress={() => setEditing(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
              <ItemForm
                fields={adapter.fields}
                values={form}
                onChange={(k, v) => {
                  setForm(prev => ({ ...prev, [k]: v }));
                  if (problem) setProblem(null);
                }}
              />
            </ScrollView>

            {problem && (
              <View style={styles.problem}>
                <Ionicons name="warning" size={14} color={Colors.ink} />
                <Text style={styles.problemText}>{problem}</Text>
              </View>
            )}

            <JackButton label="Save" icon="checkmark" onPress={handleSave} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress }: {
  label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
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

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, paddingHorizontal: 12,
    borderRadius: Jack.radius, borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  search: {
    flex: 1, height: 42, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
  },

  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 12 },
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

  list: { padding: 20, gap: 12 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 44 },
  emptyText: {
    fontFamily: Type.body, fontSize: 13.5, color: Colors.onSurfaceVariant,
    textAlign: 'center', paddingHorizontal: 30,
  },

  rowOuter: { position: 'relative' },
  rowShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  rowFace: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 13, marginBottom: 4,
  },
  rowMain: { flex: 1, gap: 3 },
  rowTitle: { fontFamily: Type.display, fontSize: 14, color: Colors.onSurface },
  rowSub: {
    fontFamily: Type.body, fontSize: 12, lineHeight: 17,
    color: Colors.onSurfaceVariant,
  },

  builtinRow: {
    gap: 3, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: Colors.outlineVariant,
  },
  builtinGroup: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 1.5, color: Colors.outline,
  },
  builtinHint: {
    fontFamily: Type.body, fontSize: 12, color: Colors.outline, marginTop: 14,
  },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,6,32,0.72)' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
    padding: 22, paddingBottom: 32, gap: 14, maxHeight: '90%',
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sheetTitle: { fontFamily: Type.display, fontSize: 19, color: Colors.onSurface },
  sheetScroll: { maxHeight: 420 },

  problem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.ink, padding: 10,
  },
  problemText: { flex: 1, fontFamily: Type.bodyBold, fontSize: 12.5, color: Colors.ink },
});
