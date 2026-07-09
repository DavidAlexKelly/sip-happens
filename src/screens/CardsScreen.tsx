// src/screens/CardsScreen.tsx
// The card library. Custom cards render as mini paper prompts (same language
// as the in-game card), and the editor keeps token chips for {player1},
// {sip}, etc. Logic unchanged.

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import { JackButton, JackIconButton } from '../components/jack';
import { CustomCard, loadCustomCards, saveCustomCards } from '../data/customDecks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cards'>;
};

const TOKEN_PRESETS = [
  { label: '{player1}', desc: 'Active player' },
  { label: '{player2}', desc: 'Second player' },
  { label: '{sip}',     desc: 'Sip amount' },
  { label: '{small}',   desc: 'Small drink' },
  { label: '{medium}',  desc: 'Medium drink' },
  { label: '{large}',   desc: 'Large drink' },
  { label: '{max}',     desc: 'Max drink' },
];

export default function CardsScreen({ navigation }: Props) {
  const [cards, setCards] = useState<CustomCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null);
  const [cardText, setCardText] = useState('');
  const [cardAction, setCardAction] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCustomCards().then(setCards);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

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

  const insertToken = (token: string) =>
    setCardText(prev => `${prev}${prev.endsWith(' ') || prev === '' ? '' : ' '}${token}`);

  const handleSave = async () => {
    if (!cardText.trim()) return;
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <Text style={styles.eyebrow}>CARD LIBRARY</Text>
            <Text style={styles.pageTitle}>MY{'\n'}<Text style={styles.pageTitleAccent}>CARDS</Text></Text>
            <Text style={styles.pageSubtitle}>Write your own challenges, then add them to a deck.</Text>
          </View>

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
                    <Text style={styles.cardText}>{card.text}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Write / edit card sheet */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingCard ? 'EDIT CARD' : 'NEW CARD'}</Text>

            <Text style={styles.inputLabel}>CHALLENGE TEXT</Text>
            <TextInput
              style={styles.modalTextArea}
              placeholder="e.g. {player1} does their best impression of {player2}, or takes {small}."
              placeholderTextColor={Colors.outline}
              value={cardText}
              onChangeText={setCardText}
              multiline
              maxLength={220}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenRow}>
              {TOKEN_PRESETS.map(t => (
                <TouchableOpacity
                  key={t.label}
                  style={styles.tokenChip}
                  onPress={() => { Haptics.selectionAsync(); insertToken(t.label); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tokenChipText}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
        </View>
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
  pageHeader: { marginTop: 4, marginBottom: 22 },
  eyebrow: { fontFamily: Type.display, fontSize: 11, letterSpacing: 2.5, color: Colors.tertiary, marginBottom: 8 },
  pageTitle: { fontFamily: Type.display, fontSize: 36, lineHeight: 39, color: Colors.onSurface },
  pageTitleAccent: { color: Colors.primary },
  pageSubtitle: { fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 10, lineHeight: 20 },

  emptySection: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptySectionText: { fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant },

  // Mini paper prompts — same visual language as the in-game card.
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  cardAction: { fontFamily: Type.display, fontSize: 10, letterSpacing: 1.5, color: '#B0489C' },
  cardText: { fontFamily: Type.bodyMedium, fontSize: 14, color: Colors.ink, lineHeight: 20 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,6,32,0.72)' },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
  },
  modalTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface, marginBottom: 20, letterSpacing: 1 },
  inputLabel: { fontFamily: Type.display, fontSize: 11, letterSpacing: 1.5, color: Colors.outline, marginBottom: 8 },
  modalTextArea: {
    minHeight: 92, borderRadius: 14, padding: 14, marginBottom: 12,
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
  tokenRow: { marginBottom: 20, flexGrow: 0 },
  tokenChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginRight: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 2, borderColor: Colors.outlineVariant,
  },
  tokenChipText: { fontFamily: Type.display, fontSize: 12, color: Colors.tertiary },
  modalBtns: { flexDirection: 'row', gap: 12 },
});
