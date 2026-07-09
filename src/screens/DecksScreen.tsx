// src/screens/DecksScreen.tsx
// Deck manager. Custom decks are color-shadowed stickers; the create/edit
// sheet keeps the same fields (name, icon, colour). Logic unchanged.

import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import { JackButton, JackIconButton } from '../components/jack';
import {
  CustomDeck, CustomCard, loadCustomDecks, saveCustomDecks,
  loadCustomCards,
} from '../data/customDecks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Decks'>;
};

const DECK_ICONS = ['sparkles', 'flame', 'wine', 'happy', 'heart', 'skull', 'game-controller', 'star'] as const;
const DECK_COLORS = [Colors.primary, Colors.secondary, Colors.tertiary, '#8C6BFF', '#B6F44A', '#FF7A3C', '#5EB8FF'];

export default function DecksScreen({ navigation }: Props) {
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [allCards, setAllCards] = useState<CustomCard[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<CustomDeck | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<string>(DECK_ICONS[0]);
  const [newColor, setNewColor] = useState<string>(DECK_COLORS[0]);

  const refresh = useCallback(() => {
    loadCustomDecks().then(setDecks);
    loadCustomCards().then(setAllCards);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const openNewModal = () => {
    setEditingDeck(null);
    setNewName('');
    setNewIcon(DECK_ICONS[0]);
    setNewColor(DECK_COLORS[0]);
    setShowNewModal(true);
  };

  const openEditModal = (deck: CustomDeck) => {
    setEditingDeck(deck);
    setNewName(deck.name);
    setNewIcon(deck.icon);
    setNewColor(deck.color);
    setShowNewModal(true);
  };

  const handleSave = async () => {
    if (!newName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let updated: CustomDeck[];
    if (editingDeck) {
      updated = decks.map(d => d.id === editingDeck.id
        ? { ...d, name: newName.trim(), icon: newIcon, color: newColor }
        : d);
    } else {
      const newDeck: CustomDeck = {
        id: `custom-deck-${Date.now()}`,
        name: newName.trim(),
        icon: newIcon,
        color: newColor,
        cardIds: [],
        createdAt: Date.now(),
      };
      updated = [newDeck, ...decks];
    }
    setDecks(updated);
    await saveCustomDecks(updated);
    setShowNewModal(false);
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>DECK MANAGER</Text>
          <Text style={styles.pageTitle}>MY{'\n'}<Text style={styles.pageTitleAccent}>DECKS</Text></Text>
          <Text style={styles.pageSubtitle}>Group your custom cards, then mix them into any game.</Text>
        </View>

        {decks.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="layers-outline" size={40} color={Colors.outlineVariant} />
            <Text style={styles.emptySectionText}>No custom decks yet.</Text>
            <TouchableOpacity onPress={openNewModal} activeOpacity={0.85}>
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
                  onPress={() => openEditModal(deck)}
                >
                  <View style={[styles.deckIconWrap, { backgroundColor: deck.color }]}>
                    <Ionicons name={deck.icon as any} size={22} color={Colors.ink} />
                  </View>
                  <View style={styles.deckInfo}>
                    <Text style={styles.deckName}>{deck.name}</Text>
                    <Text style={styles.deckMeta}>
                      {deck.cardIds.length} card{deck.cardIds.length !== 1 ? 's' : ''}
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
            {allCards.length} card{allCards.length !== 1 ? 's' : ''} in your library — manage them in the Cards tab.
          </Text>
        )}
      </ScrollView>

      {/* Create / edit deck sheet */}
      <Modal visible={showNewModal} transparent animationType="slide" onRequestClose={() => setShowNewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingDeck ? 'EDIT DECK' : 'NEW DECK'}</Text>

            <Text style={styles.inputLabel}>NAME</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Flat Party Pack"
              placeholderTextColor={Colors.outline}
              value={newName}
              onChangeText={setNewName}
              maxLength={30}
            />

            <Text style={styles.inputLabel}>ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
              {DECK_ICONS.map(ic => (
                <TouchableOpacity
                  key={ic}
                  onPress={() => { setNewIcon(ic); Haptics.selectionAsync(); }}
                  style={[
                    styles.iconChip,
                    newIcon === ic && { backgroundColor: newColor, borderColor: Colors.ink },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name={ic as any} size={20} color={newIcon === ic ? Colors.ink : Colors.outline} />
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
              <View style={{ flex: 1 }}>
                <JackButton label="Cancel" variant="ghost" size="medium" onPress={() => setShowNewModal(false)} />
              </View>
              <View style={{ flex: 2 }}>
                <JackButton
                  label={editingDeck ? 'Save' : 'Create Deck'}
                  size="medium"
                  disabled={!newName.trim()}
                  onPress={handleSave}
                />
              </View>
            </View>
          </View>
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

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,6,32,0.72)' },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
  },
  modalTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface, marginBottom: 20, letterSpacing: 1 },
  inputLabel: { fontFamily: Type.display, fontSize: 11, letterSpacing: 1.5, color: Colors.outline, marginBottom: 8 },
  modalInput: {
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
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2.5, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: Colors.onSurface },
  modalBtns: { flexDirection: 'row', gap: 12 },
});
