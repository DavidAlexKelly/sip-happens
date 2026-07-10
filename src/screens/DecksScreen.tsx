// src/screens/DecksScreen.tsx
// Deck manager v3:
//   • FIX: the deck editor modal now applies safe-area insets manually
//     (useSafeAreaInsets) — RN <Modal> doesn't reliably inherit SafeAreaView
//     insets, which left the close/save buttons under the iPhone status bar.
//   • NEW: decks can include built-in Sip Happens cards. The editor's
//     checklist has MY CARDS / SIP HAPPENS source tabs (with a category
//     filter), and built-in picks are stored as "builtin:<id>" references.
//   • The editor's card list is a FlatList so the few-hundred-card built-in
//     library scrolls smoothly.

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Alert, Keyboard, TouchableWithoutFeedback,
  KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type, ModeColors, ModeLabels } from '../styles/theme';
import { ALL_CHALLENGES, Challenge } from '../data/gameData';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import TokenText from '../components/TokenText';
import { JackButton, JackIconButton } from '../components/jack';
import {
  CustomDeck, CustomCard, loadCustomDecks, saveCustomDecks,
  loadCustomCards, builtinRefId, isBuiltinRef, resolveBuiltinRef,
} from '../data/customDecks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Decks'>;
};

type CardSource = 'mine' | 'builtin';

const DECK_ICONS = ['sparkles', 'flame', 'wine', 'happy', 'heart', 'skull', 'game-controller', 'star'] as const;
const DECK_COLORS = [Colors.primary, Colors.secondary, Colors.tertiary, '#8C6BFF', '#B6F44A', '#FF7A3C', '#5EB8FF'];
const CATEGORY_FILTERS = ['all', 'drink', 'dare', 'truth', 'chaos', 'spicy'] as const;

export default function DecksScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [allCards, setAllCards] = useState<CustomCard[]>([]);

  // Deck editor state
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingDeck, setEditingDeck] = useState<CustomDeck | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(DECK_ICONS[0]);
  const [color, setColor] = useState<string>(DECK_COLORS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cardSource, setCardSource] = useState<CardSource>('mine');
  const [builtinFilter, setBuiltinFilter] = useState<string>('all');

  const refresh = useCallback(() => {
    loadCustomDecks().then(setDecks);
    loadCustomCards().then(setAllCards);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  /** An id is valid if it points at an existing custom card or built-in card. */
  const isValidId = useCallback((id: string) => {
    if (isBuiltinRef(id)) return resolveBuiltinRef(id) !== undefined;
    return allCards.some(c => c.id === id);
  }, [allCards]);

  const openNewEditor = () => {
    setEditingDeck(null);
    setName('');
    setIcon(DECK_ICONS[0]);
    setColor(DECK_COLORS[0]);
    setSelectedIds([]);
    setCardSource('mine');
    setBuiltinFilter('all');
    setEditorVisible(true);
  };

  const openEditEditor = (deck: CustomDeck) => {
    setEditingDeck(deck);
    setName(deck.name);
    setIcon(deck.icon);
    setColor(deck.color);
    setSelectedIds(deck.cardIds.filter(isValidId));
    setCardSource('mine');
    setBuiltinFilter('all');
    setEditorVisible(true);
  };

  const toggleId = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  /** Copy every card from another deck into this one (no duplicates). */
  const importFromDeck = (source: CustomDeck) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIds(prev => {
      const merged = new Set(prev);
      source.cardIds.forEach(id => { if (isValidId(id)) merged.add(id); });
      return Array.from(merged);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let updated: CustomDeck[];
    if (editingDeck) {
      updated = decks.map(d => d.id === editingDeck.id
        ? { ...d, name: name.trim(), icon, color, cardIds: selectedIds }
        : d);
    } else {
      const newDeck: CustomDeck = {
        id: `custom-deck-${Date.now()}`,
        name: name.trim(),
        icon,
        color,
        cardIds: selectedIds,
        createdAt: Date.now(),
      };
      updated = [newDeck, ...decks];
    }
    setDecks(updated);
    await saveCustomDecks(updated);
    setEditorVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Deck', 'This removes the deck. Your cards stay in My Cards.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const updated = decks.filter(d => d.id !== id);
          setDecks(updated);
          await saveCustomDecks(updated);
        },
      },
    ]);
  };

  const otherDecks = decks.filter(d => d.id !== editingDeck?.id && d.cardIds.length > 0);

  const builtinList = useMemo(
    () => builtinFilter === 'all'
      ? ALL_CHALLENGES
      : ALL_CHALLENGES.filter(c => c.mode === builtinFilter),
    [builtinFilter],
  );

  // ── Editor pieces ────────────────────────────────────────────

  // Passed as an ELEMENT (not a component) so the TextInput keeps focus
  // across re-renders while typing.
  const editorHeaderEl = (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View>
        <Text style={styles.inputLabel}>NAME</Text>
        <TextInput
          style={styles.editorInput}
          placeholder="e.g. Flat Party Pack"
          placeholderTextColor={Colors.outline}
          value={name}
          onChangeText={setName}
          maxLength={30}
        />

        <Text style={styles.inputLabel}>ICON</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
          {DECK_ICONS.map(ic => (
            <TouchableOpacity
              key={ic}
              onPress={() => { setIcon(ic); Haptics.selectionAsync(); }}
              style={[
                styles.iconChip,
                icon === ic && { backgroundColor: color, borderColor: Colors.ink },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name={ic as any} size={20} color={icon === ic ? Colors.ink : Colors.outline} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>COLOUR</Text>
        <View style={styles.colorRow}>
          {DECK_COLORS.map(col => (
            <TouchableOpacity
              key={col}
              onPress={() => { setColor(col); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.colorDot, { backgroundColor: col }, color === col && styles.colorDotActive]}
              activeOpacity={0.7}
            />
          ))}
        </View>

        {otherDecks.length > 0 && (
          <>
            <Text style={styles.inputLabel}>IMPORT ALL CARDS FROM</Text>
            <View style={styles.importRow}>
              {otherDecks.map(d => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => importFromDeck(d)}
                  activeOpacity={0.8}
                  style={[styles.importChip, { borderColor: d.color }]}
                >
                  <Ionicons name={d.icon as any} size={14} color={d.color} />
                  <Text style={styles.importChipText}>{d.name}</Text>
                  <Text style={[styles.importChipCount, { color: d.color }]}>+{d.cardIds.length}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.cardsHeaderRow}>
          <Text style={styles.inputLabel}>ADD CARDS</Text>
          <Text style={styles.cardsCount}>{selectedIds.length} in deck</Text>
        </View>

        {/* Source tabs: your library vs the built-in Sip Happens cards */}
        <View style={styles.sourceTabRow}>
          <TouchableOpacity
            onPress={() => { if (cardSource !== 'mine') { Haptics.selectionAsync(); setCardSource('mine'); } }}
            activeOpacity={0.85}
            style={[styles.sourceTab, cardSource === 'mine' && styles.sourceTabActive]}
          >
            <Text style={[styles.sourceTabText, cardSource === 'mine' && styles.sourceTabTextActive]}>
              MY CARDS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { if (cardSource !== 'builtin') { Haptics.selectionAsync(); setCardSource('builtin'); } }}
            activeOpacity={0.85}
            style={[styles.sourceTab, cardSource === 'builtin' && styles.sourceTabActive]}
          >
            <Text style={[styles.sourceTabText, cardSource === 'builtin' && styles.sourceTabTextActive]}>
              SIP HAPPENS
            </Text>
          </TouchableOpacity>
        </View>

        {cardSource === 'builtin' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORY_FILTERS.map(cat => {
              const active = builtinFilter === cat;
              const chipColor = cat === 'all' ? Colors.onSurface : (ModeColors[cat] || Colors.primary);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { Haptics.selectionAsync(); setBuiltinFilter(cat); }}
                  activeOpacity={0.8}
                  style={[
                    styles.filterChip,
                    active && { backgroundColor: chipColor, borderColor: Colors.ink },
                  ]}
                >
                  <Text style={[styles.filterChipText, active && { color: Colors.ink }]}>
                    {cat === 'all' ? 'All' : (ModeLabels[cat] || cat)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {cardSource === 'mine' && allCards.length === 0 && (
          <View style={styles.emptyCards}>
            <Text style={styles.emptyCardsText}>
              Your card library is empty. Write cards in the Cards tab, or switch to
              SIP HAPPENS to add built-in cards.
            </Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  const renderMineItem = ({ item }: { item: CustomCard }) => {
    const checked = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleId(item.id)}
        activeOpacity={0.85}
        style={[
          styles.checkCard,
          checked && { borderColor: color, backgroundColor: Colors.surfaceContainerHigh },
        ]}
      >
        <View style={[
          styles.checkbox,
          checked ? { backgroundColor: color, borderColor: Colors.ink } : { borderColor: Colors.outlineVariant },
        ]}>
          {checked && <Ionicons name="checkmark" size={15} color={Colors.ink} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.checkCardAction}>{item.action.toUpperCase()}</Text>
          <TokenText text={item.text} variant="stage" fontSize={13} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderBuiltinItem = ({ item }: { item: Challenge }) => {
    const refId = builtinRefId(item.id);
    const checked = selectedIds.includes(refId);
    const badgeColor = ModeColors[item.mode] || Colors.primary;
    return (
      <TouchableOpacity
        onPress={() => toggleId(refId)}
        activeOpacity={0.85}
        style={[
          styles.checkCard,
          checked && { borderColor: color, backgroundColor: Colors.surfaceContainerHigh },
        ]}
      >
        <View style={[
          styles.checkbox,
          checked ? { backgroundColor: color, borderColor: Colors.ink } : { borderColor: Colors.outlineVariant },
        ]}>
          {checked && <Ionicons name="checkmark" size={15} color={Colors.ink} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.builtinTopRow}>
            <View style={[styles.categoryBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.categoryBadgeText}>{ModeLabels[item.mode] || item.mode}</Text>
            </View>
            <Text style={styles.intensityText}>{'🌶'.repeat(item.intensity)}</Text>
          </View>
          <TokenText text={item.text} variant="stage" fontSize={13} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Logo />
        <JackIconButton
          icon="add"
          onPress={openNewEditor}
          color={Colors.primary}
          iconColor={Colors.ink}
          size={42}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>DECK MANAGER</Text>
          <Text style={styles.pageTitle}>MY{'\n'}<Text style={styles.pageTitleAccent}>DECKS</Text></Text>
          <Text style={styles.pageSubtitle}>Build decks from your own cards and Sip Happens cards, then mix them into any game.</Text>
        </View>

        {decks.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="layers-outline" size={40} color={Colors.outlineVariant} />
            <Text style={styles.emptySectionText}>No custom decks yet.</Text>
            <TouchableOpacity onPress={openNewEditor} activeOpacity={0.85}>
              <Text style={[styles.emptySectionText, { color: Colors.primary, marginTop: 4, fontFamily: Type.display }]}>
                Create your first deck →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.deckList}>
            {decks.map((deck, i) => (
              <View
                key={deck.id}
                style={[styles.deckOuter, { transform: [{ rotate: i % 2 === 0 ? '-0.4deg' : '0.4deg' }] }]}
              >
                <View style={[styles.deckShadow, { backgroundColor: deck.color }]} />
                <TouchableOpacity
                  style={styles.deckFace}
                  activeOpacity={0.9}
                  onPress={() => openEditEditor(deck)}
                >
                  <View style={[styles.deckIconWrap, { backgroundColor: deck.color }]}>
                    <Ionicons name={deck.icon as any} size={22} color={Colors.ink} />
                  </View>
                  <View style={styles.deckInfo}>
                    <Text style={styles.deckName}>{deck.name}</Text>
                    <Text style={styles.deckMeta}>
                      {deck.cardIds.length} card{deck.cardIds.length !== 1 ? 's' : ''} — tap to edit
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(deck.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={19} color={Colors.outline} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {allCards.length > 0 && (
          <Text style={styles.footnote}>
            {allCards.length} card{allCards.length !== 1 ? 's' : ''} in your library — write more in the Cards tab.
          </Text>
        )}
      </ScrollView>

      {/* ── Deck editor — full screen, safe-area applied manually ── */}
      <Modal
        visible={editorVisible}
        animationType="slide"
        onRequestClose={() => setEditorVisible(false)}
      >
        <View style={[styles.editorContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.editorHeader}>
              <JackIconButton icon="close" onPress={() => setEditorVisible(false)} size={42} />
              <Text style={styles.editorTitle}>{editingDeck ? 'EDIT DECK' : 'NEW DECK'}</Text>
              <View style={{ width: 96 }}>
                <JackButton label="Save" size="small" disabled={!name.trim()} onPress={handleSave} />
              </View>
            </View>

            {cardSource === 'mine' ? (
              <FlatList
                data={allCards}
                keyExtractor={item => item.id}
                renderItem={renderMineItem}
                ListHeaderComponent={editorHeaderEl}
                contentContainerStyle={styles.editorScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                extraData={selectedIds}
              />
            ) : (
              <FlatList
                data={builtinList}
                keyExtractor={item => item.id}
                renderItem={renderBuiltinItem}
                ListHeaderComponent={editorHeaderEl}
                contentContainerStyle={styles.editorScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                initialNumToRender={12}
                windowSize={7}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                extraData={selectedIds}
              />
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <BottomNav current="decks" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 130 },
  pageHeader: { marginTop: 4, marginBottom: 22 },
  eyebrow: { fontFamily: Type.display, fontSize: 11, letterSpacing: 2.5, color: Colors.secondary, marginBottom: 8 },
  pageTitle: { fontFamily: Type.display, fontSize: 36, lineHeight: 39, color: Colors.onSurface },
  pageTitleAccent: { color: Colors.primary },
  pageSubtitle: { fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 10, lineHeight: 20 },

  emptySection: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptySectionText: { fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant },

  deckList: { gap: 14 },
  deckOuter: { position: 'relative' },
  deckShadow: {
    position: 'absolute', top: Jack.shadow, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius,
  },
  deckFace: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: Jack.radius, borderWidth: Jack.border, borderColor: Colors.ink,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 14, marginBottom: Jack.shadow,
  },
  deckIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  deckInfo: { flex: 1 },
  deckName: { fontFamily: Type.display, fontSize: 16, color: Colors.onSurface },
  deckMeta: { fontFamily: Type.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  footnote: {
    fontFamily: Type.body, fontSize: 12, color: Colors.outline,
    textAlign: 'center', marginTop: 26,
  },

  // ── Deck editor ──
  editorContainer: { flex: 1, backgroundColor: Colors.background },
  editorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: Jack.border, borderBottomColor: Colors.ink,
  },
  editorTitle: { fontFamily: Type.display, fontSize: 15, letterSpacing: 1.5, color: Colors.onSurface },
  editorScroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  inputLabel: { fontFamily: Type.display, fontSize: 11, letterSpacing: 1.5, color: Colors.outline, marginBottom: 8 },
  editorInput: {
    height: 52, borderRadius: 14, paddingHorizontal: 16, marginBottom: 20,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 15,
    borderWidth: 2.5, borderColor: Colors.ink,
  },
  iconRow: { marginBottom: 20, flexGrow: 0 },
  iconChip: {
    width: 44, height: 44, borderRadius: 12, marginRight: 8,
    borderWidth: 2.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2.5, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: Colors.onSurface },

  importRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  importChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 2.5,
    backgroundColor: Colors.surfaceContainerLow,
  },
  importChipText: { fontFamily: Type.display, fontSize: 11, color: Colors.onSurface },
  importChipCount: { fontFamily: Type.display, fontSize: 11 },

  cardsHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardsCount: { fontFamily: Type.display, fontSize: 12, color: Colors.primary, marginBottom: 8 },

  sourceTabRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  sourceTab: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    borderWidth: 2.5, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow,
  },
  sourceTabActive: { backgroundColor: Colors.primary, borderColor: Colors.ink },
  sourceTabText: { fontFamily: Type.display, fontSize: 11, letterSpacing: 1, color: Colors.onSurfaceVariant },
  sourceTabTextActive: { color: Colors.ink },

  filterRow: { marginBottom: 12, flexGrow: 0 },
  filterChip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  filterChipText: { fontFamily: Type.display, fontSize: 11, color: Colors.onSurfaceVariant },

  emptyCards: {
    padding: 20, borderRadius: Jack.radius,
    borderWidth: 2, borderColor: Colors.outlineVariant, borderStyle: 'dashed',
  },
  emptyCardsText: { fontFamily: Type.body, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19 },

  checkCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2.5, marginTop: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCardAction: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 1.2,
    color: Colors.outline, marginBottom: 4,
  },

  builtinTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7,
    borderWidth: 2, borderColor: Colors.ink,
  },
  categoryBadgeText: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 0.8,
    color: Colors.ink, textTransform: 'uppercase',
  },
  intensityText: { fontSize: 10 },
});
