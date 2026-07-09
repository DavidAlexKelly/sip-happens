// src/screens/DeckSelectScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Type } from '../styles/theme';
import { MODES } from '../data/gameData';
import { useGame } from '../components/GameContext';
import { loadCustomDecks, CustomDeck } from '../data/customDecks';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeckSelect'>;
};

export default function DeckSelectScreen({ navigation }: Props) {
  const { state, toggleMode } = useGame();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([]);

  useEffect(() => {
    loadCustomDecks().then(setCustomDecks);
  }, []);

  const allBuiltInSelected = MODES.every(m => state.selectedModes.includes(m.id));

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleMode(id);
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    MODES.forEach(m => {
      const isSelected = state.selectedModes.includes(m.id);
      if (allBuiltInSelected ? isSelected : !isSelected) toggleMode(m.id);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHOOSE DECKS</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>PICK YOUR{'\n'}<Text style={styles.pageTitleAccent}>DECKS</Text></Text>
          <Text style={styles.pageSubtitle}>Mix in as many as you like.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>BUILT-IN DECKS</Text>
          <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
            <Text style={styles.selectAllText}>{allBuiltInSelected ? 'CLEAR' : 'SELECT ALL'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.deckGrid}>
          {MODES.map(mode => {
            const isSelected = state.selectedModes.includes(mode.id);
            const isLast = state.selectedModes.length === 1 && isSelected;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => { if (!isLast) handleToggle(mode.id); }}
                activeOpacity={0.85}
                style={[
                  styles.deckCard,
                  isSelected && { borderColor: mode.color, backgroundColor: `${mode.color}14` },
                ]}
              >
                <View style={styles.deckCardTop}>
                  <View style={[styles.deckIconWrap, { backgroundColor: `${mode.color}22` }]}>
                    <Ionicons name={mode.icon as any} size={22} color={mode.color} />
                  </View>
                  <View style={[
                    styles.checkbox,
                    isSelected ? { backgroundColor: mode.color, borderColor: mode.color } : { borderColor: Colors.outlineVariant },
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </View>
                <Text style={styles.deckLabel}>{mode.label}</Text>
                <Text style={styles.deckDesc}>{mode.desc}</Text>
                <View style={styles.deckMeta}>
                  <Text style={styles.deckMetaText}>{mode.intensity}</Text>
                  <Text style={styles.deckMetaDot}>·</Text>
                  <Text style={styles.deckMetaText}>{mode.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {customDecks.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>YOUR DECKS</Text>
            </View>
            <View style={styles.customList}>
              {customDecks.map(deck => {
                const isSelected = state.selectedModes.includes(deck.id);
                return (
                  <TouchableOpacity
                    key={deck.id}
                    onPress={() => handleToggle(deck.id)}
                    activeOpacity={0.85}
                    style={[
                      styles.customCard,
                      isSelected && { borderColor: deck.color, backgroundColor: `${deck.color}14` },
                    ]}
                  >
                    <View style={[styles.deckIconWrap, { backgroundColor: `${deck.color}22` }]}>
                      <Ionicons name={(deck.icon as any) || 'sparkles'} size={20} color={deck.color} />
                    </View>
                    <View style={styles.customCardInfo}>
                      <Text style={[styles.deckLabel, { fontSize: 15 }]}>{deck.name}</Text>
                      <Text style={styles.deckDesc}>{deck.cardIds.length} card{deck.cardIds.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      isSelected ? { backgroundColor: deck.color, borderColor: deck.color } : { borderColor: Colors.outlineVariant },
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('Players');
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.continueBtnInner}
          >
            <Text style={styles.continueBtnText}>NEXT — ADD PLAYERS</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.onPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Type.bodyBold, fontSize: 13, letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  pageHeader: { marginTop: 8, marginBottom: 24 },
  pageTitle: { fontFamily: Type.display, fontSize: 34, lineHeight: 36, color: Colors.onSurface },
  pageTitleAccent: { color: Colors.primary },
  pageSubtitle: { fontFamily: Type.body, fontSize: 15, color: Colors.onSurfaceVariant, marginTop: 8 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, marginBottom: 12,
  },
  sectionLabel: { fontFamily: Type.bodyBold, fontSize: 11, letterSpacing: 2, color: Colors.outline },
  selectAllText: { fontFamily: Type.bodyBold, fontSize: 11, letterSpacing: 1, color: Colors.primary },

  deckGrid: { gap: 10 },
  deckCard: {
    borderRadius: 18, borderWidth: 1, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow, padding: 16,
  },
  deckCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  deckIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  deckLabel: { fontFamily: Type.display, fontSize: 16, color: Colors.onSurface, marginBottom: 4 },
  deckDesc: { fontFamily: Type.body, fontSize: 12.5, color: Colors.onSurfaceVariant, lineHeight: 18 },
  deckMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  deckMetaText: { fontFamily: Type.bodyBold, fontSize: 10, letterSpacing: 1, color: Colors.outline, textTransform: 'uppercase' },
  deckMetaDot: { color: Colors.outline },

  customList: { gap: 8 },
  customCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow, padding: 12,
  },
  customCardInfo: { flex: 1 },

  continueBtn: { marginTop: 28 },
  continueBtnInner: {
    height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  continueBtnText: { fontFamily: Type.display, fontSize: 15, letterSpacing: 1.2, color: Colors.onPrimary },
});