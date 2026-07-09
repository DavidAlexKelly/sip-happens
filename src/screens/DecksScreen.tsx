// src/screens/DecksScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Type } from '../styles/theme';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';
import {
  CustomDeck, CustomCard, loadCustomDecks, saveCustomDecks,
  loadCustomCards,
} from '../data/customDecks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Decks'>;
};

const DECK_ICONS = ['sparkles', 'flame', 'wine', 'happy', 'heart', 'skull', 'game-controller', 'star'] as const;
const DECK_COLORS = [Colors.primary, Colors.secondary, Colors.tertiary, '#7A5CFF', '#3AD6C4', '#FF4F9A', '#5EC8FF'];

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
        <TouchableOpacity onPress={openNewModal} style={styles.headerIconCircle} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={Colors.onPrimary} />
        </TouchableOpacity>
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
              <Text style={[styles.emptySectionText, { color: Colors.primary, marginTop: 4 }]}>
                Create your first deck →
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.deckList}>
            {decks.map(deck => (
              <TouchableOpacity
                key={deck.id}
                style={styles.deckCard}
                activeOpacity={0.85}
                onPress={() => openEditModal(deck)}
              >
                <View style={[styles.deckIconWrap, { backgroundColor: `${deck.color}22` }]}>
                  <Ionicons name={deck.icon as any} size={22} color={deck.color} />
                </View>
                <View style={styles.deckInfo}>
                  <Text style={styles.deckName}>{deck.name}</Text>
                  <Text style={styles.deckMeta}>{deck.cardIds.length} card{deck.cardIds.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(deck.id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={Colors.outline} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav current="decks" navigation={navigation} />

      <Modal visible={showNewModal} transparent animationType="slide" onRequestClose={() => setShowNewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editingDeck ? 'Edit Deck' : 'New Deck'}</Text>

            <Text style={styles.inputLabel}>NAME</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Office Party"
              placeholderTextColor={Colors.outline}
              value={newName}
              onChangeText={setNewName}
              maxLength={30}
            />

            <Text style={styles.inputLabel}>ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {DECK_ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => { setNewIcon(icon); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.iconOption, newIcon === icon && { borderColor: newColor, backgroundColor: `${newColor}22` }]}
                >
                  <Ionicons name={icon as any} size={20} color={newIcon === icon ? newColor : Colors.outline} />
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
                onPress={handleSave}
                activeOpacity={0.85}
                style={[styles.modalSaveWrapper, !newName.trim() && { opacity: 0.4 }]}
                disabled={!newName.trim()}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryContainer]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.modalSave}
                >
                  <Text style={styles.modalSaveText}>{editingDeck ? 'SAVE' : 'CREATE DECK'}</Text>
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

  deckList: { gap: 10 },
  deckCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  deckIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deckInfo: { flex: 1 },
  deckName: { fontFamily: Type.bodyBold, fontSize: 15, color: Colors.onSurface },
  deckMeta: { fontFamily: Type.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  deleteBtn: { padding: 4 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalSheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  modalTitle: { fontFamily: Type.display, fontSize: 20, color: Colors.onSurface, marginBottom: 20 },
  inputLabel: { fontFamily: Type.bodyBold, fontSize: 11, letterSpacing: 1.5, color: Colors.outline, marginBottom: 8 },
  modalInput: {
    height: 50, borderRadius: 14, paddingHorizontal: 16, marginBottom: 20,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 15, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  iconOption: {
    width: 44, height: 44, borderRadius: 12, marginRight: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.onSurface },
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