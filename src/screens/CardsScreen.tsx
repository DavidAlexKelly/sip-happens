// src/screens/CardsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Type } from '../styles/theme';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
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

  const insertToken = (token: string) => setCardText(prev => `${prev}${prev.endsWith(' ') || prev === '' ? '' : ' '}${token}`);

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
      <View style={styles.header}>
        <Logo />
        <TouchableOpacity onPress={openNewModal} style={styles.headerIconCircle} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={Colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <Text style={styles.eyebrow}>CUSTOM CARDS</Text>
            <Text style={styles.pageTitle}>MY{'\n'}<Text style={styles.pageTitleAccent}>CARDS</Text></Text>
            <Text style={styles.pageSubtitle}>
              Write your own prompts. Tokens like {'{player1}'} swap in real names during the game.
            </Text>
          </View>

          {cards.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="create-outline" size={40} color={Colors.outlineVariant} />
              <Text style={styles.emptySectionText}>No custom cards yet.</Text>
              <TouchableOpacity onPress={openNewModal} activeOpacity={0.85}>
                <Text style={[styles.emptySectionText, { color: Colors.primary, marginTop: 4 }]}>
                  Write your first card →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardList}>
              {cards.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.cardItem}
                  activeOpacity={0.85}
                  onPress={() => openEditModal(card)}
                >
                  <View style={styles.cardItemTop}>
                    <Text style={styles.cardAction}>{card.action.toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => handleDelete(card.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={16} color={Colors.outline} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardText}>{previewText(card.text)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <BottomNav current="cards" navigation={navigation} />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingCard ? 'Edit Card' : 'New Card'}</Text>

            <Text style={styles.inputLabel}>CARD TEXT</Text>
            <TextInput
              style={styles.modalTextArea}
              placeholder="e.g. {player1}: take {sip} or reveal your last text."
              placeholderTextColor={Colors.outline}
              value={cardText}
              onChangeText={setCardText}
              multiline
              maxLength={220}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {TOKEN_PRESETS.map(t => (
                <TouchableOpacity key={t.label} onPress={() => insertToken(t.label)} style={styles.tokenChip}>
                  <Text style={styles.tokenChipText}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>ACTION LABEL (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Confess"
              placeholderTextColor={Colors.outline}
              value={cardAction}
              onChangeText={setCardAction}
              maxLength={24}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)} activeOpacity={0.7}>
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
                  <Text style={styles.modalSaveText}>{editingCard ? 'SAVE' : 'ADD CARD'}</Text>
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
  },
  headerIconCircle: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  pageHeader: { marginTop: 8, marginBottom: 24 },
  eyebrow: { fontFamily: Type.bodyBold, fontSize: 11, letterSpacing: 2.5, color: Colors.secondary, marginBottom: 8 },
  pageTitle: { fontFamily: Type.display, fontSize: 36, lineHeight: 38, color: Colors.onSurface },
  pageTitleAccent: { color: Colors.primary },
  pageSubtitle: { fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 10, lineHeight: 20 },

  emptySection: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptySectionText: { fontFamily: Type.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },

  cardList: { gap: 10 },
  cardItem: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cardItemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardAction: { fontFamily: Type.bodyBold, fontSize: 10, letterSpacing: 1.5, color: Colors.primary },
  cardText: { fontFamily: Type.bodyMedium, fontSize: 14, color: Colors.onSurface, lineHeight: 20 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalSheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  modalTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface, marginBottom: 20 },
  inputLabel: { fontFamily: Type.bodyBold, fontSize: 11, letterSpacing: 1.5, color: Colors.outline, marginBottom: 8 },
  modalTextArea: {
    minHeight: 90, borderRadius: 14, padding: 14, marginBottom: 12,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 15, borderWidth: 1, borderColor: Colors.outlineVariant,
    textAlignVertical: 'top',
  },
  modalInput: {
    height: 50, borderRadius: 14, paddingHorizontal: 16, marginBottom: 20,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 15, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  tokenChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, marginRight: 8,
    backgroundColor: Colors.surfaceContainerHigh, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  tokenChipText: { fontFamily: Type.bodyBold, fontSize: 12, color: Colors.secondary },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  modalCancelText: { fontFamily: Type.bodyBold, fontSize: 14, color: Colors.onSurfaceVariant },
  modalSaveWrapper: { flex: 2 },
  modalSave: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { fontFamily: Type.display, fontSize: 14, letterSpacing: 1, color: Colors.onPrimary },
});