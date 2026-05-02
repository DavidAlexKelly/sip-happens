import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../styles/theme';
import { BottomNav } from './WelcomeScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cards'>;
};

export interface CustomCard {
  id: string;
  text: string;
  action: string;
  createdAt: number;
}

const STORAGE_KEY = '@nekkit_custom_cards';

const TOKEN_PRESETS = [
  { label: '{player1}', desc: 'Active player' },
  { label: '{player2}', desc: 'Second player' },
  { label: '{sip}',     desc: 'Sip amount' },
  { label: '{small}',   desc: 'Small drink' },
  { label: '{medium}',  desc: 'Medium drink' },
  { label: '{large}',   desc: 'Large drink' },
  { label: '{max}',     desc: 'Max drink' },
];

export async function loadCustomCards(): Promise<CustomCard[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveCustomCards(cards: CustomCard[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export default function CardsScreen({ navigation }: Props) {
  const [cards, setCards] = useState<CustomCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null);
  const [cardText, setCardText] = useState('');
  const [cardAction, setCardAction] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCustomCards().then(c => {
      setCards(c);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, []);

  const openNew = () => {
    setEditingCard(null);
    setCardText('');
    setCardAction('');
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openEdit = (card: CustomCard) => {
    setEditingCard(card);
    setCardText(card.text);
    setCardAction(card.action);
    setShowModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const insertToken = (token: string) => {
    setCardText(prev => prev + token);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!cardText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let updated: CustomCard[];
    if (editingCard) {
      updated = cards.map(c =>
        c.id === editingCard.id
          ? { ...c, text: cardText.trim(), action: cardAction.trim() || 'Do it' }
          : c
      );
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
    Alert.alert('Delete Card', 'Remove this card from your deck?', [
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

  // Preview: replace tokens with example values
  const previewText = (text: string) => text
    .replace(/{player1}/g, 'Alex')
    .replace(/{player2}/g, 'Jordan')
    .replace(/{sip}/g, '1 sip')
    .replace(/{small}/g, '2 sips')
    .replace(/{medium}/g, '3 sips')
    .replace(/{large}/g, '4 sips')
    .replace(/{max}/g, '5 sips');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.titleGradient}
        >
          <Text style={styles.headerTitle}>NEKKIT</Text>
        </LinearGradient>
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Page header */}
          <View style={styles.pageHeader}>
            <Text style={styles.eyebrow}>CUSTOM DECK</Text>
            <Text style={styles.pageTitle}>MY{'\n'}<Text style={styles.pageTitleAccent}>CARDS</Text></Text>
            <Text style={styles.pageSubtitle}>
              Create your own challenges. Tokens like {'{player1}'} swap in real names during the game.
            </Text>
          </View>

          {/* New card button */}
          <TouchableOpacity onPress={openNew} activeOpacity={0.85} style={styles.newCardBtnWrapper}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.newCardBtn}
            >
              <Ionicons name="add-circle" size={22} color={Colors.onPrimary} />
              <Text style={styles.newCardBtnText}>NEW CARD</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Empty state */}
          {cards.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color={Colors.outlineVariant} />
              <Text style={styles.emptyTitle}>No cards yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap NEW CARD to create your first custom challenge.
              </Text>
            </View>
          )}

          {/* Card list */}
          {cards.length > 0 && (
            <View style={styles.cardList}>
              <View style={styles.listHeader}>
                <Text style={styles.listLabel}>Your Cards</Text>
                <Text style={styles.cardCount}>{String(cards.length).padStart(2, '0')}</Text>
              </View>

              {cards.map(card => (
                <View key={card.id} style={styles.cardItem}>
                  <View style={styles.cardItemInner}>
                    <Text style={styles.cardItemAction}>{card.action.toUpperCase()}</Text>
                    <Text style={styles.cardItemText}>{previewText(card.text)}</Text>
                    {/* Show raw token version in muted text */}
                    {card.text.includes('{') && (
                      <Text style={styles.cardItemRaw} numberOfLines={1}>{card.text}</Text>
                    )}
                  </View>
                  <View style={styles.cardItemActions}>
                    <TouchableOpacity
                      onPress={() => openEdit(card)}
                      style={styles.cardActionBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="pencil" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(card.id)}
                      style={styles.cardActionBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.outline} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <BottomNav current="cards" navigation={navigation} />

      {/* Create / Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              {editingCard ? 'EDIT CARD' : 'NEW CARD'}
            </Text>

            {/* Card text input */}
            <Text style={styles.inputLabel}>CHALLENGE TEXT</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. {player1} must do 10 push-ups or take {medium}."
              placeholderTextColor={Colors.outline}
              value={cardText}
              onChangeText={setCardText}
              multiline
              numberOfLines={4}
              maxLength={280}
              autoFocus
            />
            <Text style={styles.charCount}>{cardText.length}/280</Text>

            {/* Token presets */}
            <Text style={styles.inputLabel}>INSERT TOKEN</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tokensRow}
            >
              {TOKEN_PRESETS.map(t => (
                <TouchableOpacity
                  key={t.label}
                  onPress={() => insertToken(t.label)}
                  style={styles.tokenChip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tokenLabel}>{t.label}</Text>
                  <Text style={styles.tokenDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Action label */}
            <Text style={styles.inputLabel}>ACTION LABEL (optional)</Text>
            <TextInput
              style={styles.actionInput}
              placeholder="e.g. Dare, Think fast, Do it"
              placeholderTextColor={Colors.outline}
              value={cardAction}
              onChangeText={setCardAction}
              maxLength={40}
              returnKeyType="done"
            />

            {/* Preview */}
            {cardText.trim().length > 0 && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>PREVIEW</Text>
                <Text style={styles.previewText}>{previewText(cardText)}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.85}
                style={[styles.modalSaveWrapper, !cardText.trim() && { opacity: 0.4 }]}
                disabled={!cardText.trim()}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryContainer]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.modalSave}
                >
                  <Text style={styles.modalSaveText}>
                    {editingCard ? 'SAVE CHANGES' : 'ADD CARD'}
                  </Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: 'rgba(14,14,17,0.9)',
  },
  titleGradient: { borderRadius: 4 },
  headerTitle: {
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
  pageTitleAccent: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    color: Colors.primary,
  },
  pageSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 8, lineHeight: 20,
  },
  newCardBtnWrapper: { marginBottom: 32 },
  newCardBtn: {
    paddingVertical: 18, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  newCardBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
  emptyState: {
    borderWidth: 1, borderColor: 'rgba(72,71,75,0.3)', borderStyle: 'dashed',
    borderRadius: 20, padding: 48,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20, color: Colors.onSurfaceVariant,
  },
  emptySubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.outline, textAlign: 'center', lineHeight: 18,
  },
  cardList: { gap: 0 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 16,
  },
  listLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline,
  },
  cardCount: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 28, color: Colors.primary,
  },
  cardItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    gap: 12,
  },
  cardItemInner: { flex: 1, gap: 4 },
  cardItemAction: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 2, color: Colors.primary, textTransform: 'uppercase',
  },
  cardItemText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14, color: Colors.onSurface, lineHeight: 20,
  },
  cardItemRaw: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11, color: Colors.outline, marginTop: 2,
  },
  cardItemActions: { flexDirection: 'column', gap: 8 },
  cardActionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 48, gap: 16,
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
  textArea: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 16, padding: 16,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15, color: Colors.onSurface,
    minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  charCount: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11, color: Colors.outline, textAlign: 'right', marginTop: -8,
  },
  tokensRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  tokenChip: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', gap: 2,
  },
  tokenLabel: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 12, color: Colors.primary,
  },
  tokenDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 10, color: Colors.outline,
  },
  actionInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurface,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  preview: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 16, padding: 16, gap: 6,
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  previewLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: Colors.primary,
  },
  previewText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15, color: Colors.onSurface, lineHeight: 22,
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
  modalSave: {
    paddingVertical: 16, borderRadius: 16,
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14, letterSpacing: 1.5, color: Colors.onPrimary,
  },
});