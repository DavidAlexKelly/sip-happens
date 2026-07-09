// src/screens/CardsScreen.tsx
// The card library, now in two tabs:
//   MY CARDS — your custom cards, tokens rendered as pills, tap to edit
//   SIP HAPPENS — every built-in card, read-only, with a category badge
//     (Drink/Dare/Truth/Chaos/Spicy) and an optional category filter
// Editor upgrades: token chips are labelled pills ("Player 1" not {player1}),
// and a live paper preview shows the card with pills as you type.
// Keyboard: tap anywhere outside an input (or drag) to dismiss.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Animated, Alert, FlatList,
  Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type, ModeColors, ModeLabels } from '../styles/theme';
import { ALL_CHALLENGES, Challenge } from '../data/gameData';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import TokenText, { TOKEN_META } from '../components/TokenText';
import { JackButton, JackIconButton } from '../components/jack';
import { CustomCard, loadCustomCards, saveCustomCards } from '../data/customDecks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cards'>;
};

type Tab = 'mine' | 'builtin';

// Tokens you can insert while writing a card, shown as labelled pills.
const TOKEN_PRESETS = [
  { token: '{player1}', label: 'Player 1', color: TOKEN_META.player1.color },
  { token: '{player2}', label: 'Player 2', color: TOKEN_META.player2.color },
  { token: '{sip}',     label: 'Sip',      color: TOKEN_META.sip.color },
  { token: '{small}',   label: 'Small',    color: TOKEN_META.small.color },
  { token: '{medium}',  label: 'Medium',   color: TOKEN_META.medium.color },
  { token: '{large}',   label: 'Large',    color: TOKEN_META.large.color },
  { token: '{max}',     label: 'MAX',      color: TOKEN_META.max.color },
];

const CATEGORY_FILTERS = ['all', 'drink', 'dare', 'truth', 'chaos', 'spicy'] as const;

export default function CardsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('mine');
  const [cards, setCards] = useState<CustomCard[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null);
  const [cardText, setCardText] = useState('');
  const [cardAction, setCardAction] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCustomCards().then(setCards);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const builtInCards = useMemo(
    () => categoryFilter === 'all'
      ? ALL_CHALLENGES
      : ALL_CHALLENGES.filter(c => c.mode === categoryFilter),
    [categoryFilter],
  );

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    Haptics.selectionAsync();
    setTab(next);
  };

  const openNewModal = () => {
    setEditingCard(null);
    setCardText('');
    setCardAction('');
    setShowModal(true);
  };

  const openEditModal = (card: CustomCard) => {
    setEditingCard(card);
    setCardText(card.text);
    setCardAction(card.action);
    setShowModal(true);
  };

  const insertToken = (token: string) => {
    Haptics.selectionAsync();
    setCardText(prev => `${prev}${prev.endsWith(' ') || prev === '' ? '' : ' '}${token}`);
  };

  const handleSave = async () => {
    if (!cardText.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let updated: CustomCard[];
    if (editingCard) {
      updated = cards.map(c => c.id === editingCard.id
        ? { ...c, text: cardText.trim(), action: cardAction.trim() || 'Do it' }
        : c);
    } else {
      const newCard: CustomCard = {
        id: Date.now().toString(),
        text: cardText.trim(),
        action: cardAction.trim() || 'Do it',
        createdAt: Date.now(),
      };
      updated = [newCard, ...cards];
    }
    setCards(updated);
    await saveCustomCards(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Card', 'Remove this card from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          const updated = cards.filter(c => c.id !== id);
          setCards(updated);
          await saveCustomCards(updated);
        },
      },
    ]);
  };

  const renderBuiltIn = ({ item, index }: { item: Challenge; index: number }) => {
    const color = ModeColors[item.mode] || Colors.primary;
    return (
      <View style={[styles.cardOuter, { transform: [{ rotate: index % 2 === 0 ? '-0.3deg' : '0.3deg' }] }]}>
        <View style={styles.cardShadow} />
        <View style={styles.cardFace}>
          <View style={styles.cardItemTop}>
            {/* Category badge */}
            <View style={[styles.categoryBadge, { backgroundColor: color }]}>
              <Text style={styles.categoryBadgeText}>
                {ModeLabels[item.mode] || item.mode}
              </Text>
            </View>
            <Text style={styles.intensityText}>{'🌶'.repeat(item.intensity)}</Text>
          </View>
          <TokenText text={item.text} variant="paper" fontSize={14} />
          <Text style={styles.builtInAction}>{item.action.toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  const listHeader = (
    <>
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>CARD LIBRARY</Text>
        <Text style={styles.pageTitle}>THE{'\n'}<Text style={styles.pageTitleAccent}>CARDS</Text></Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => switchTab('mine')}
          activeOpacity={0.85}
          style={[styles.tabChip, tab === 'mine' && styles.tabChipActive]}
        >
          <Text style={[styles.tabChipText, tab === 'mine' && styles.tabChipTextActive]}>
            MY CARDS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => switchTab('builtin')}
          activeOpacity={0.85}
          style={[styles.tabChip, tab === 'builtin' && styles.tabChipActive]}
        >
          <Text style={[styles.tabChipText, tab === 'builtin' && styles.tabChipTextActive]}>
            SIP HAPPENS
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'builtin' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORY_FILTERS.map(cat => {
            const active = categoryFilter === cat;
            const color = cat === 'all' ? Colors.onSurface : (ModeColors[cat] || Colors.primary);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => { Haptics.selectionAsync(); setCategoryFilter(cat); }}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  active && { backgroundColor: color, borderColor: Colors.ink },
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
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Logo />
        <JackIconButton
          icon="add"
          onPress={openNewModal}
          color={Colors.primary}
          iconColor={Colors.ink}
          size={42}
        />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {tab === 'mine' ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {listHeader}
            {cards.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="card-outline" size={40} color={Colors.outlineVariant} />
                <Text style={styles.emptySectionText}>No custom cards yet.</Text>
                <TouchableOpacity onPress={openNewModal} activeOpacity={0.85}>
                  <Text style={[styles.emptySectionText, { color: Colors.primary, marginTop: 4, fontFamily: Type.display }]}>
                    Write your first card →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cardList}>
                {cards.map((card, i) => (
                  <View
                    key={card.id}
                    style={[styles.cardOuter, { transform: [{ rotate: i % 2 === 0 ? '-0.4deg' : '0.4deg' }] }]}
                  >
                    <View style={styles.cardShadow} />
                    <TouchableOpacity
                      style={styles.cardFace}
                      activeOpacity={0.9}
                      onPress={() => openEditModal(card)}
                    >
                      <View style={styles.cardItemTop}>
                        <Text style={styles.cardAction}>{card.action.toUpperCase()}</Text>
                        <TouchableOpacity
                          onPress={() => handleDelete(card.id)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={17} color="#8A82A0" />
                        </TouchableOpacity>
                      </View>
                      <TokenText text={card.text} variant="paper" fontSize={14} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={builtInCards}
            keyExtractor={item => item.id}
            renderItem={renderBuiltIn}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            windowSize={7}
            ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          />
        )}
      </Animated.View>

      {/* ── Write / edit card sheet ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Tap the dimmed area to close (and drop the keyboard) */}
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowModal(false); }}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>{editingCard ? 'EDIT CARD' : 'NEW CARD'}</Text>

              <Text style={styles.inputLabel}>CHALLENGE TEXT</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="e.g. Player 1 does their best impression of Player 2, or takes a small drink."
                placeholderTextColor={Colors.outline}
                value={cardText}
                onChangeText={setCardText}
                multiline
                maxLength={220}
              />

              <Text style={styles.inputLabel}>TAP TO INSERT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tokenRow}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={{ gap: 8 }}
              >
                {TOKEN_PRESETS.map(t => (
                  <TouchableOpacity
                    key={t.token}
                    style={[styles.tokenChip, { backgroundColor: t.color }]}
                    onPress={() => insertToken(t.token)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={12} color={Colors.ink} />
                    <Text style={styles.tokenChipText}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Live preview — the card as it will look, tokens as pills */}
              {cardText.trim().length > 0 && (
                <>
                  <Text style={styles.inputLabel}>PREVIEW</Text>
                  <View style={styles.previewOuter}>
                    <View style={styles.previewShadow} />
                    <View style={styles.previewFace}>
                      <TokenText text={cardText} variant="paper" fontSize={14} />
                    </View>
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>ACTION LABEL (OPTIONAL)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Drink up"
                placeholderTextColor={Colors.outline}
                value={cardAction}
                onChangeText={setCardAction}
                maxLength={24}
              />

              <View style={styles.modalBtns}>
                <View style={{ flex: 1 }}>
                  <JackButton label="Cancel" variant="ghost" size="medium" onPress={() => setShowModal(false)} />
                </View>
                <View style={{ flex: 2 }}>
                  <JackButton
                    label={editingCard ? 'Save' : 'Add Card'}
                    size="medium"
                    disabled={!cardText.trim()}
                    onPress={handleSave}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNav current="cards" navigation={navigation} />
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
  pageHeader: { marginTop: 4, marginBottom: 18 },
  eyebrow: { fontFamily: Type.display, fontSize: 11, letterSpacing: 2.5, color: Colors.tertiary, marginBottom: 8 },
  pageTitle: { fontFamily: Type.display, fontSize: 36, lineHeight: 39, color: Colors.onSurface },
  pageTitleAccent: { color: Colors.primary },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tabChip: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
    borderWidth: 2.5, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow,
  },
  tabChipActive: { backgroundColor: Colors.primary, borderColor: Colors.ink },
  tabChipText: { fontFamily: Type.display, fontSize: 12, letterSpacing: 1, color: Colors.onSurfaceVariant },
  tabChipTextActive: { color: Colors.ink },

  // Category filter (built-in tab)
  filterRow: { marginBottom: 16, flexGrow: 0 },
  filterChip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  filterChipText: { fontFamily: Type.display, fontSize: 11, color: Colors.onSurfaceVariant },

  emptySection: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptySectionText: { fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant },

  // Paper mini prompts
  cardList: { gap: 14 },
  cardOuter: { position: 'relative' },
  cardShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  cardFace: {
    backgroundColor: Colors.paper,
    borderRadius: Jack.radius, borderWidth: Jack.border, borderColor: Colors.ink,
    padding: 16, marginBottom: 4,
  },
  cardItemTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  cardAction: { fontFamily: Type.display, fontSize: 10, letterSpacing: 1.5, color: '#B0489C' },
  categoryBadge: {
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.ink,
  },
  categoryBadgeText: {
    fontFamily: Type.display, fontSize: 10, letterSpacing: 0.8,
    color: Colors.ink, textTransform: 'uppercase',
  },
  intensityText: { fontSize: 11 },
  builtInAction: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 1.2,
    color: '#8A82A0', marginTop: 8,
  },

  // Editor sheet
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
  },
  modalTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface, marginBottom: 20, letterSpacing: 1 },
  inputLabel: { fontFamily: Type.display, fontSize: 11, letterSpacing: 1.5, color: Colors.outline, marginBottom: 8 },
  modalTextArea: {
    minHeight: 88, borderRadius: 14, padding: 14, marginBottom: 16,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 15,
    borderWidth: 2.5, borderColor: Colors.ink,
    textAlignVertical: 'top',
  },
  modalInput: {
    height: 50, borderRadius: 14, paddingHorizontal: 16, marginBottom: 22,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 15,
    borderWidth: 2.5, borderColor: Colors.ink,
  },
  tokenRow: { marginBottom: 16, flexGrow: 0 },
  tokenChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.ink,
  },
  tokenChipText: { fontFamily: Type.display, fontSize: 12, color: Colors.ink },

  previewOuter: { position: 'relative', marginBottom: 16 },
  previewShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  previewFace: {
    backgroundColor: Colors.paper,
    borderRadius: Jack.radius, borderWidth: 2.5, borderColor: Colors.ink,
    padding: 14, marginBottom: 4,
  },

  modalBtns: { flexDirection: 'row', gap: 12 },
});
