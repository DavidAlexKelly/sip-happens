import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../styles/theme';
import { MODES } from '../data/gameData';
import { useGame } from '../components/GameContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeckSelect'>;
};

// Custom deck storage key (matches DecksScreen)
const DECKS_KEY = '@nekkit_custom_decks';

export interface CustomDeck {
  id: string;
  name: string;
  icon: string;
  color: string;
  cardIds: string[];
  createdAt: number;
}

export async function loadCustomDecks(): Promise<CustomDeck[]> {
  try {
    const raw = await AsyncStorage.getItem(DECKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function DeckSelectScreen({ navigation }: Props) {
  const { state, toggleMode } = useGame();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([]);

  useEffect(() => {
    loadCustomDecks().then(setCustomDecks);
  }, []);

  const selectedCount = state.selectedModes.length;
  const allBuiltInSelected = MODES.every(m => state.selectedModes.includes(m.id));

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleMode(id);
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (allBuiltInSelected) {
      MODES.forEach(m => {
        if (state.selectedModes.includes(m.id) && m.id !== MODES[0].id) toggleMode(m.id);
      });
    } else {
      MODES.forEach(m => {
        if (!state.selectedModes.includes(m.id)) toggleMode(m.id);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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
          <Text style={styles.pageSubtitle}>Select one or more decks to mix into your game.</Text>
        </View>

        {/* Built-in decks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>BUILT-IN DECKS</Text>
          <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
            <Text style={styles.selectAllText}>{allBuiltInSelected ? 'RESET' : 'SELECT ALL'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.deckList}>
          {MODES.map(mode => {
            const isSelected = state.selectedModes.includes(mode.id);
            const isLast = state.selectedModes.length === 1 && isSelected;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => !isLast && handleToggle(mode.id)}
                activeOpacity={0.85}
                disabled={isLast}
              >
                <View style={[
                  styles.deckCard,
                  isSelected && {
                    borderColor: `${mode.color}50`,
                    shadowColor: mode.color,
                    shadowOpacity: 0.25,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 4 },
                  },
                  !isSelected && styles.deckCardUnselected,
                ]}>
                  {isSelected && (
                    <LinearGradient
                      colors={[`${mode.color}10`, `${mode.color}18`]}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                  )}
                  <View style={styles.deckWatermark}>
                    <Ionicons name={mode.icon as any} size={72} color={mode.color} style={{ opacity: isSelected ? 0.10 : 0.04 }} />
                  </View>
                  <View style={styles.deckRow}>
                    <View style={[styles.deckIconCircle, { backgroundColor: isSelected ? `${mode.color}18` : Colors.surfaceContainerHighest }]}>
                      <Ionicons name={mode.icon as any} size={20} color={isSelected ? mode.color : Colors.outline} />
                    </View>
                    <View style={styles.deckInfo}>
                      <Text style={[styles.deckLabel, { color: isSelected ? mode.color : Colors.onSurfaceVariant }]}>{mode.label}</Text>
                      <Text style={styles.deckDesc} numberOfLines={2}>{mode.desc}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected ? { backgroundColor: mode.color, borderColor: mode.color } : { borderColor: Colors.outlineVariant }]}>
                      {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  </View>
                  <View style={styles.deckTags}>
                    <View style={[styles.deckTag, { backgroundColor: isSelected ? `${mode.color}15` : Colors.surfaceContainerHighest }]}>
                      <Text style={[styles.deckTagText, { color: isSelected ? mode.color : Colors.outline }]}>{mode.intensity}</Text>
                    </View>
                    <View style={styles.deckTag}>
                      <Text style={[styles.deckTagText, { color: Colors.onSurfaceVariant }]}>{mode.time}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom decks */}
        {customDecks.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionLabel}>YOUR DECKS</Text>
            </View>
            <View style={styles.deckList}>
              {customDecks.map(deck => {
                const isSelected = state.selectedModes.includes(deck.id);
                return (
                  <TouchableOpacity
                    key={deck.id}
                    onPress={() => handleToggle(deck.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[
                      styles.deckCard,
                      isSelected && { borderColor: `${deck.color}50` },
                      !isSelected && styles.deckCardUnselected,
                    ]}>
                      {isSelected && (
                        <LinearGradient
                          colors={[`${deck.color}10`, `${deck.color}18`]}
                          style={StyleSheet.absoluteFillObject}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                      )}
                      <View style={styles.deckRow}>
                        <View style={[styles.deckIconCircle, { backgroundColor: isSelected ? `${deck.color}18` : Colors.surfaceContainerHighest }]}>
                          <Ionicons name={deck.icon as any} size={20} color={isSelected ? deck.color : Colors.outline} />
                        </View>
                        <View style={styles.deckInfo}>
                          <Text style={[styles.deckLabel, { color: isSelected ? deck.color : Colors.onSurfaceVariant }]}>{deck.name}</Text>
                          <Text style={styles.deckDesc}>{deck.cardIds.length} custom card{deck.cardIds.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={[styles.checkbox, isSelected ? { backgroundColor: deck.color, borderColor: deck.color } : { borderColor: Colors.outlineVariant }]}>
                          {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Continue CTA */}
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
            <Text style={styles.continueBtnText}>
              NEXT — ADD PLAYERS
            </Text>
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
    backgroundColor: 'rgba(14,14,17,0.9)',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13, letterSpacing: 2, color: Colors.onSurface, textTransform: 'uppercase',
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  pageHeader: { marginTop: 28, marginBottom: 24 },
  pageTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 44, letterSpacing: -2, lineHeight: 46, color: Colors.onSurface, marginBottom: 8,
  },
  pageTitleAccent: { fontFamily: 'PlusJakartaSans_800ExtraBold_Italic', color: Colors.primary },
  pageSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline,
  },
  selectAllText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 2, color: Colors.onSurfaceVariant, textTransform: 'uppercase',
  },
  deckList: { gap: 10 },
  deckCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 16,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: 'transparent',
  },
  deckCardUnselected: { opacity: 0.55 },
  deckWatermark: { position: 'absolute', top: 8, right: 8 },
  deckRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  deckIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  deckInfo: { flex: 1 },
  deckLabel: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 17, letterSpacing: -0.3, marginBottom: 2,
  },
  deckDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 16,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  deckTags: { flexDirection: 'row', gap: 8 },
  deckTag: {
    paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: Colors.surfaceContainerHighest, borderRadius: 999,
  },
  deckTagText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  continueBtn: { marginTop: 28 },
  continueBtnInner: {
    paddingVertical: 20, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  continueBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
});