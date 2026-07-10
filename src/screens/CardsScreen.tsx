// src/screens/CardsScreen.tsx
// The card library v3:
//   • SEARCH — one search field filters whichever tab you're on, matching
//     title, card text (with tokens read as their labels), action, category
//   • TITLES — custom cards store a title (required in the editor); legacy
//     custom cards and built-in cards derive one via utils/cardTitles
//   • CATEGORIES — custom cards are categorised Drink/Dare/Truth/Chaos/
//     Spicy/Other; the category plays through to the in-game badge, and the
//     filter row now works on both tabs

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
import { getChallengeTitle, getCardTitle, titleFromText } from '../utils/cardTitles';
import {
  CustomCard, CardCategory, CARD_CATEGORIES,
  loadCustomCards, saveCustomCards,
} from '../data/customDecks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cards'>;
};

type Tab = 'mine' | 'builtin';

const TOKEN_PRESETS = [
  { token: '{player1}', label: 'Player 1', color: TOKEN_META.player1.color },
  { token: '{player2}', label: 'Player 2', color: TOKEN_META.player2.color },
  { token: '{sip}',     label: 'Sip',      color: TOKEN_META.sip.color },
  { token: '{small}',   label: 'Small',    color: TOKEN_META.small.color },
  { token: '{medium}',  label: 'Medium',   color: TOKEN_META.medium.color },
  { token: '{large}',   label: 'Large',    color: TOKEN_META.large.color },
  { token: '{max}',     label: 'MAX',      color: TOKEN_META.max.color },
];

/** Lower-cased haystack for search: title + text (tokens → labels) + action + category. */
function searchHaystack(title: string, text: string, action: string, category: string): string {
  const readable = text.replace(/\{(\w+)\}/g, (_, k: string) => TOKEN_META[k]?.label ?? k);
  return `${title} ${readable} ${action} ${category}`.toLowerCase();
}

export default function CardsScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('mine');
  const [cards, setCards] = useState<CustomCard[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardText, setCardText] = useState('');
  const [cardAction, setCardAction] = useState('');
  const [cardCategory, setCardCategory] = useState<CardCategory>('other');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCustomCards().then(setCards);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const q = query.trim().toLowerCase();

  const myFiltered = useMemo(() => {
    let list = cards;
    if (categoryFilter !== 'all') {
      list = list.filter(c => (c.category ?? 'other') === categoryFilter);
    }
    if (q) {
      list = list.filter(c => searchHaystack(
        getCardTitle(c), c.text, c.action, ModeLabels[c.category ?? 'other'] ?? '',
      ).includes(q));
    }
    return list;
  }, [cards, categoryFilter, q]);

  const builtInFiltered = useMemo(() => {
    let list: Challenge[] = categoryFilter === 'all' || categoryFilter === 'other'
      ? ALL_CHALLENGES
      : ALL_CHALLENGES.filter(c => c.mode === categoryFilter);
    if (q) {
      list = list.filter(c => searchHaystack(
        getChallengeTitle(c), c.text, c.action, ModeLabels[c.mode] ?? c.mode,
      ).includes(q));
    }
    return list;
  }, [categoryFilter, q]);

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    Haptics.selectionAsync();
    setTab(next);
    // 'other' has no built-in cards — reset the filter when crossing over.
    if (next === 'builtin' && categoryFilter === 'other') setCategoryFilter('all');
  };

  const openNewModal = () => {
    setEditingCard(null);
    setCardTitle('');
    setCardText('');
    setCardAction('');
    setCardCategory('other');
    setShowModal(true);
  };

  const openEditModal = (card: CustomCard) => {
    setEditingCard(card);
    setCardTitle(getCardTitle(card)); // legacy cards get their derived title prefilled
    setCardText(card.text);
    setCardAction(card.action);
    setCardCategory(card.category ?? 'other');
    setShowModal(true);
  };

  const insertToken = (token: string) => {
    Haptics.selectionAsync();
    setCardText(prev => `${prev}${prev.endsWith(' ') || prev === '' ? '' : ' '}${token}`);
  };

  const canSave = cardText.trim().length > 0 && cardTitle.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let updated: CustomCard[];
    if (editingCard) {
      updated = cards.map(c => c.id === editingCard.id
        ? {
            ...c,
            title: cardTitle.trim(),
            text: cardText.trim(),
            action: cardAction.trim() || 'Do it',
            category: cardCategory,
          }
        : c);
    } else {
      const newCard: CustomCard = {
        id: Date.now().toString(),
        title: cardTitle.trim(),
        text: cardText.trim(),
        action: cardAction.trim() || 'Do it',
        category: cardCategory,
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

  // ── Renderers ────────────────────────────────────────────────

  const renderMine = ({ item, index }: { item: CustomCard; index: number }) => {
    const cat = item.category ?? 'other';
    const badgeColor = ModeColors[cat] || Colors.primary;
    return (
      <View style={[styles.cardOuter, { transform: [{ rotate: index % 2 === 0 ? '-0.4deg' : '0.4deg' }] }]}>
        <View style={styles.cardShadow} />
        <TouchableOpacity style={styles.cardFace} activeOpacity={0.9} onPress={() => openEditModal(item)}>
          <View style={styles.cardItemTop}>
            <View style={[styles.categoryBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.categoryBadgeText}>{ModeLabels[cat] || cat}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color="#8A82A0" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardTitle}>{getCardTitle(item)}</Text>
          <TokenText text={item.text} variant="paper" fontSize={13} />
          <Text style={styles.cardActionFoot}>{item.action.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBuiltIn = ({ item, index }: { item: Challenge; index: number }) => {
    const color = ModeColors[item.mode] || Colors.primary;
    return (
      <View style={[styles.cardOuter, { transform: [{ rotate: index % 2 === 0 ? '-0.3deg' : '0.3deg' }] }]}>
        <View style={styles.cardShadow} />
        <View style={styles.cardFace}>
          <View style={styles.cardItemTop}>
            <View style={[styles.categoryBadge, { backgroundColor: color }]}>
              <Text style={styles.categoryBadgeText}>{ModeLabels[item.mode] || item.mode}</Text>
            </View>
            <Text style={styles.intensityText}>{'🌶'.repeat(item.intensity)}</Text>
          </View>
          <Text style={styles.cardTitle}>{getChallengeTitle(item)}</Text>
          <TokenText text={item.text} variant="paper" fontSize={13} />
          <Text style={styles.cardActionFoot}>{item.action.toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  const emptyMine = (
    <View style={styles.emptySection}>
      <Ionicons name="card-outline" size={40} color={Colors.outlineVariant} />
      <Text style={styles.emptySectionText}>
        {q || categoryFilter !== 'all' ? 'No cards match.' : 'No custom cards yet.'}
      </Text>
      {!q && categoryFilter === 'all' && (
        <TouchableOpacity onPress={openNewModal} activeOpacity={0.85}>
          <Text style={[styles.emptySectionText, { color: Colors.primary, marginTop: 4, fontFamily: Type.display }]}>
            Write your first card →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const emptyBuiltin = (
    <View style={styles.emptySection}>
      <Ionicons name="search-outline" size={40} color={Colors.outlineVariant} />
      <Text style={styles.emptySectionText}>No cards match.</Text>
    </View>
  );

  const filterChips = tab === 'mine' ? ['all', ...CARD_CATEGORIES] : ['all', 'drink', 'dare', 'truth', 'chaos', 'spicy'];

  const listHeader = (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View>
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
            <Text style={[styles.tabChipText, tab === 'mine' && styles.tabChipTextActive]}>MY CARDS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchTab('builtin')}
            activeOpacity={0.85}
            style={[styles.tabChip, tab === 'builtin' && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, tab === 'builtin' && styles.tabChipTextActive]}>SIP HAPPENS</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchOuter}>
          <View style={styles.searchShadow} />
          <View style={styles.searchFace}>
            <Ionicons name="search" size={17} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder={tab === 'mine' ? 'Search my cards...' : 'Search Sip Happens cards...'}
              placeholderTextColor={Colors.outline}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => { setQuery(''); Haptics.selectionAsync(); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.outline} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category filter — both tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {filterChips.map(cat => {
            const active = categoryFilter === cat;
            const color = cat === 'all' ? Colors.onSurface : (ModeColors[cat] || Colors.primary);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => { Haptics.selectionAsync(); setCategoryFilter(cat); }}
                activeOpacity={0.8}
                style={[styles.filterChip, active && { backgroundColor: color, borderColor: Colors.ink }]}
              >
                <Text style={[styles.filterChipText, active && { color: Colors.ink }]}>
                  {cat === 'all' ? 'All' : (ModeLabels[cat] || cat)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
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
        <FlatList
          data={tab === 'mine' ? myFiltered : builtInFiltered}
          keyExtractor={item => item.id}
          renderItem={(tab === 'mine' ? renderMine : renderBuiltIn) as any}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={tab === 'mine' ? emptyMine : emptyBuiltin}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={10}
          windowSize={7}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          extraData={[tab, query, categoryFilter]}
        />
      </Animated.View>

      {/* ── Write / edit card sheet ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowModal(false); }}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalSheet}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <Text style={styles.modalTitle}>{editingCard ? 'EDIT CARD' : 'NEW CARD'}</Text>

                <Text style={styles.inputLabel}>TITLE</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Impression Roulette"
                  placeholderTextColor={Colors.outline}
                  value={cardTitle}
                  onChangeText={setCardTitle}
                  maxLength={40}
                />

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

                <Text style={styles.inputLabel}>CATEGORY</Text>
                <View style={styles.categoryRow}>
                  {CARD_CATEGORIES.map(cat => {
                    const active = cardCategory === cat;
                    const color = ModeColors[cat] || Colors.primary;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => { Haptics.selectionAsync(); setCardCategory(cat); }}
                        activeOpacity={0.8}
                        style={[styles.filterChip, active && { backgroundColor: color, borderColor: Colors.ink }]}
                      >
                        <Text style={[styles.filterChipText, active && { color: Colors.ink }]}>
                          {ModeLabels[cat] || cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Live preview */}
                {cardText.trim().length > 0 && (
                  <>
                    <Text style={styles.inputLabel}>PREVIEW</Text>
                    <View style={styles.previewOuter}>
                      <View style={styles.previewShadow} />
                      <View style={styles.previewFace}>
                        <View style={styles.cardItemTop}>
                          <View style={[styles.categoryBadge, { backgroundColor: ModeColors[cardCategory] || Colors.primary }]}>
                            <Text style={styles.categoryBadgeText}>{ModeLabels[cardCategory]}</Text>
                          </View>
                        </View>
                        <Text style={styles.cardTitle}>
                          {cardTitle.trim() || titleFromText(cardText)}
                        </Text>
                        <TokenText text={cardText} variant="paper" fontSize={13} />
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
                      disabled={!canSave}
                      onPress={handleSave}
                    />
                  </View>
                </View>
              </ScrollView>
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

  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tabChip: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
    borderWidth: 2.5, borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerLow,
  },
  tabChipActive: { backgroundColor: Colors.primary, borderColor: Colors.ink },
  tabChipText: { fontFamily: Type.display, fontSize: 12, letterSpacing: 1, color: Colors.onSurfaceVariant },
  tabChipTextActive: { color: Colors.ink },

  // Search field
  searchOuter: { position: 'relative', marginBottom: 12 },
  searchShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  searchFace: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 48, borderRadius: Jack.radius, paddingHorizontal: 14, marginBottom: 4,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 2.5, borderColor: Colors.ink,
  },
  searchInput: {
    flex: 1, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
    paddingVertical: 0,
  },

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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  cardTitle: {
    fontFamily: Type.display, fontSize: 15, color: Colors.ink, marginBottom: 5,
  },
  categoryBadge: {
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.ink,
  },
  categoryBadgeText: {
    fontFamily: Type.display, fontSize: 10, letterSpacing: 0.8,
    color: Colors.ink, textTransform: 'uppercase',
  },
  intensityText: { fontSize: 11 },
  cardActionFoot: {
    fontFamily: Type.display, fontSize: 9, letterSpacing: 1.2,
    color: '#8A82A0', marginTop: 8,
  },

  // Editor sheet
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
    maxHeight: '88%',
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
    height: 50, borderRadius: 14, paddingHorizontal: 16, marginBottom: 16,
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

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },

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

  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
