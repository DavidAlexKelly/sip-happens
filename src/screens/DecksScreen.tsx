import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../styles/theme';
import { MODES } from '../data/gameData';
import BottomNav from '../components/BottomNav';
import { loadCustomCards, CustomCard } from './CardsScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Decks'>;
};

export interface CustomDeck {
  id: string;
  name: string;
  icon: string;
  color: string;
  cardIds: string[];
  createdAt: number;
}

const DECKS_KEY = '@nekkit_custom_decks';

const DECK_ICONS = [
  'flame', 'flash', 'heart', 'star', 'wine', 'beer', 'happy',
  'trophy', 'mic', 'musical-notes', 'game-controller', 'people',
] as const;

const DECK_COLORS = [
  '#ff7afb', '#00fbfb', '#ff7cba', '#ff6e84',
  '#ed6ae9', '#f0c040', '#4fc3f7', '#81c784',
];

async function saveDecks(decks: CustomDeck[]) {
  await AsyncStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

async function loadDecks(): Promise<CustomDeck[]> {
  try {
    const raw = await AsyncStorage.getItem(DECKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

type ScreenView = 'list' | 'edit';

export default function DecksScreen({ navigation }: Props) {
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [allCards, setAllCards] = useState<CustomCard[]>([]);
  const [view, setView] = useState<ScreenView>('list');
  const [activeDeck, setActiveDeck] = useState<CustomDeck | null>(null);

  // New deck modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<string>('flame');
  const [newColor, setNewColor] = useState(DECK_COLORS[0]);

  // Card picker modal
  const [showCardPicker, setShowCardPicker] = useState(false);

  const reload = useCallback(async () => {
    const [d, c] = await Promise.all([loadDecks(), loadCustomCards()]);
    setDecks(d);
    setAllCards(c);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const deck: CustomDeck = {
      id: Date.now().toString(),
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      cardIds: [],
      createdAt: Date.now(),
    };
    const updated = [...decks, deck];
    setDecks(updated);
    await saveDecks(updated);
    setShowNewModal(false);
    setNewName('');
    // Immediately open edit view
    setActiveDeck(deck);
    setView('edit');
  };

  const handleDeleteDeck = (id: string) => {
    Alert.alert('Delete Deck', 'Remove this deck permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const updated = decks.filter(d => d.id !== id);
          setDecks(updated);
          await saveDecks(updated);
          if (activeDeck?.id === id) {
            setActiveDeck(null);
            setView('list');
          }
        },
      },
    ]);
  };

  const toggleCardInDeck = async (cardId: string) => {
    if (!activeDeck) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const has = activeDeck.cardIds.includes(cardId);
    const updatedDeck = {
      ...activeDeck,
      cardIds: has
        ? activeDeck.cardIds.filter(id => id !== cardId)
        : [...activeDeck.cardIds, cardId],
    };
    const updatedDecks = decks.map(d => d.id === activeDeck.id ? updatedDeck : d);
    setActiveDeck(updatedDeck);
    setDecks(updatedDecks);
    await saveDecks(updatedDecks);
  };

  const previewText = (text: string) => text
    .replace(/{player1}/g, 'Alex').replace(/{player2}/g, 'Jordan')
    .replace(/{sip}/g, '1 sip').replace(/{small}/g, '2 sips')
    .replace(/{medium}/g, '3 sips').replace(/{large}/g, '4 sips')
    .replace(/{max}/g, '5 sips');

  // ─── EDIT VIEW ───────────────────────────────────────────────────────────────
  if (view === 'edit' && activeDeck) {
    const deckCards = allCards.filter(c => activeDeck.cardIds.includes(c.id));
    const remainingCards = allCards.filter(c => !activeDeck.cardIds.includes(c.id));

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('list')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={[styles.headerIconCircle, { backgroundColor: `${activeDeck.color}20` }]}>
            <Ionicons name={activeDeck.icon as any} size={16} color={activeDeck.color} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>{activeDeck.name.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => handleDeleteDeck(activeDeck.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.outline} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cards in this deck */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>IN THIS DECK</Text>
            <Text style={styles.sectionCount}>{deckCards.length} CARD{deckCards.length !== 1 ? 'S' : ''}</Text>
          </View>

          {deckCards.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No cards yet. Add some below.</Text>
            </View>
          ) : (
            <View style={styles.cardsList}>
              {deckCards.map(card => (
                <View key={card.id} style={[styles.cardRow, { borderColor: `${activeDeck.color}30` }]}>
                  <View style={styles.cardRowInner}>
                    <Text style={[styles.cardRowAction, { color: activeDeck.color }]}>{card.action.toUpperCase()}</Text>
                    <Text style={styles.cardRowText}>{previewText(card.text)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleCardInDeck(card.id)} style={styles.cardRowRemove} activeOpacity={0.7}>
                    <Ionicons name="remove-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Available cards to add */}
          {remainingCards.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 28 }]}>
                <Text style={styles.sectionLabel}>ADD FROM MY CARDS</Text>
                <Text style={styles.sectionCount}>{remainingCards.length} AVAILABLE</Text>
              </View>
              <View style={styles.cardsList}>
                {remainingCards.map(card => (
                  <View key={card.id} style={styles.cardRow}>
                    <View style={styles.cardRowInner}>
                      <Text style={styles.cardRowAction}>{card.action.toUpperCase()}</Text>
                      <Text style={styles.cardRowText}>{previewText(card.text)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleCardInDeck(card.id)} style={styles.cardRowAdd} activeOpacity={0.7}>
                      <Ionicons name="add-circle" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {allCards.length === 0 && (
            <View style={styles.emptySection}>
              <Ionicons name="card-outline" size={32} color={Colors.outlineVariant} />
              <Text style={styles.emptySectionText}>You haven't created any cards yet.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Cards')} activeOpacity={0.8}>
                <Text style={[styles.emptySectionText, { color: Colors.primary, marginTop: 4 }]}>Go to Cards to create some →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <BottomNav current="decks" navigation={navigation} />
      </SafeAreaView>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.titleGradient}
        >
          <Text style={styles.logoText}>NEKKIT</Text>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>DECK MANAGER</Text>
          <Text style={styles.pageTitle}>MY{'\n'}<Text style={styles.pageTitleAccent}>DECKS</Text></Text>
          <Text style={styles.pageSubtitle}>
            Create custom decks from your cards. Select them when starting a game.
          </Text>
        </View>

        {/* New deck button */}
        <TouchableOpacity onPress={() => setShowNewModal(true)} activeOpacity={0.85} style={styles.newBtnWrapper}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.newBtn}
          >
            <Ionicons name="add-circle" size={22} color={Colors.onPrimary} />
            <Text style={styles.newBtnText}>NEW DECK</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Built-in decks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>BUILT-IN DECKS</Text>
        </View>
        <View style={styles.decksList}>
          {MODES.map(mode => (
            <View key={mode.id} style={[styles.deckItem, { borderColor: `${mode.color}25` }]}>
              <View style={[styles.deckIconCircle, { backgroundColor: `${mode.color}18` }]}>
                <Ionicons name={mode.icon as any} size={20} color={mode.color} />
              </View>
              <View style={styles.deckItemInfo}>
                <Text style={[styles.deckItemName, { color: mode.color }]}>{mode.label}</Text>
                <Text style={styles.deckItemMeta}>{mode.intensity} · {mode.time}</Text>
              </View>
              <View style={styles.builtInBadge}>
                <Text style={styles.builtInText}>BUILT-IN</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Custom decks */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionLabel}>YOUR DECKS</Text>
          <Text style={styles.sectionCount}>{decks.length}</Text>
        </View>

        {decks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={48} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>No custom decks</Text>
            <Text style={styles.emptySubtitle}>Tap NEW DECK to build your own deck from your custom cards.</Text>
          </View>
        ) : (
          <View style={styles.decksList}>
            {decks.map(deck => (
              <TouchableOpacity
                key={deck.id}
                onPress={() => { setActiveDeck(deck); setView('edit'); }}
                activeOpacity={0.85}
              >
                <View style={[styles.deckItem, { borderColor: `${deck.color}30` }]}>
                  <View style={[styles.deckIconCircle, { backgroundColor: `${deck.color}18` }]}>
                    <Ionicons name={deck.icon as any} size={20} color={deck.color} />
                  </View>
                  <View style={styles.deckItemInfo}>
                    <Text style={[styles.deckItemName, { color: deck.color }]}>{deck.name}</Text>
                    <Text style={styles.deckItemMeta}>{deck.cardIds.length} card{deck.cardIds.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.outline} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav current="decks" navigation={navigation} />

      {/* New Deck Modal */}
      <Modal visible={showNewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>NEW DECK</Text>

            <Text style={styles.inputLabel}>DECK NAME</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g. House Rules, Office Party..."
              placeholderTextColor={Colors.outline}
              value={newName}
              onChangeText={setNewName}
              maxLength={40}
              autoFocus
            />

            <Text style={styles.inputLabel}>ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconRow}>
              {DECK_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => { setNewIcon(icon); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.iconOption, newIcon === icon && { backgroundColor: `${newColor}30`, borderColor: newColor }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name={icon as any} size={22} color={newIcon === icon ? newColor : Colors.outline} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>COLOUR</Text>
            <View style={styles.colorRow}>
              {DECK_COLORS.map(col => (
                <TouchableOpacity
                  key={col}
                  onPress={() => { setNewColor(col); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.colorDot, { backgroundColor: col }, newColor === col && styles.colorDotActive]}
                  activeOpacity={0.7}
                />
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowNewModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                activeOpacity={0.85}
                style={[styles.modalSaveWrapper, !newName.trim() && { opacity: 0.4 }]}
                disabled={!newName.trim()}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryContainer]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.modalSave}
                >
                  <Text style={styles.modalSaveText}>CREATE DECK</Text>
                </LinearGradient>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: 'rgba(14,14,17,0.9)',
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14, letterSpacing: 1, color: Colors.onSurface,
  },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  titleGradient: { borderRadius: 4 },
  logoText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 17, letterSpacing: -0.5, color: Colors.onPrimary, paddingHorizontal: 4,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  pageHeader: { marginTop: 32, marginBottom: 28 },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 4, color: Colors.primary, textTransform: 'uppercase', marginBottom: 8,
  },
  pageTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 56, letterSpacing: -2, lineHeight: 58, color: Colors.onSurface,
  },
  pageTitleAccent: { fontFamily: 'PlusJakartaSans_800ExtraBold_Italic', color: Colors.primary },
  pageSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 8, lineHeight: 20,
  },
  newBtnWrapper: { marginBottom: 32 },
  newBtn: {
    paddingVertical: 18, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  newBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16, letterSpacing: 2, color: Colors.onPrimary,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline,
  },
  sectionCount: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 18, color: Colors.primary,
  },
  decksList: { gap: 8 },
  deckItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 14,
    borderWidth: 1,
  },
  deckIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  deckItemInfo: { flex: 1 },
  deckItemName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 16, letterSpacing: -0.3,
  },
  deckItemMeta: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12, color: Colors.outline, marginTop: 2,
  },
  builtInBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  builtInText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 8, letterSpacing: 2, color: Colors.outline, textTransform: 'uppercase',
  },
  emptyState: {
    borderWidth: 1, borderColor: 'rgba(72,71,75,0.3)', borderStyle: 'dashed',
    borderRadius: 20, padding: 40,
    alignItems: 'center', gap: 10,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18, color: Colors.onSurfaceVariant,
  },
  emptySubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.outline, textAlign: 'center', lineHeight: 18,
  },
  emptySection: {
    paddingVertical: 24, alignItems: 'center', gap: 8,
  },
  emptySectionText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.outline, textAlign: 'center',
  },
  cardsList: { gap: 8 },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cardRowInner: { flex: 1, gap: 3 },
  cardRowAction: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 2, color: Colors.outline, textTransform: 'uppercase',
  },
  cardRowText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13, color: Colors.onSurface, lineHeight: 18,
  },
  cardRowRemove: { padding: 4 },
  cardRowAdd: { padding: 4 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 48, gap: 14,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center', marginBottom: 4,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22, color: Colors.onSurface, letterSpacing: -0.5,
  },
  inputLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline,
  },
  nameInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15, color: Colors.onSurface,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  iconRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  iconOption: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3, borderColor: Colors.onSurface,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest,
  },
  modalCancelText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14, color: Colors.onSurfaceVariant,
  },
  modalSaveWrapper: { flex: 2 },
  modalSave: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  modalSaveText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14, letterSpacing: 1.5, color: Colors.onPrimary,
  },
});