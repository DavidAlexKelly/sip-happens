import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../styles/theme';
import { MODES } from '../data/gameData';
import { useGame } from '../components/GameContext';
import { BottomNav } from './WelcomeScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Modes'>;
};

export default function ModesScreen({ navigation }: Props) {
  const { state, toggleMode } = useGame();

  const selectedCount = state.selectedModes.length;
  const allSelected = selectedCount === MODES.length;

  const handleSelectAll = () => {
    // If all are already selected, reset to just social
    if (allSelected) {
      MODES.forEach(m => {
        if (state.selectedModes.includes(m.id) && m.id !== 'social') toggleMode(m.id);
      });
      if (!state.selectedModes.includes('social')) toggleMode('social');
    } else {
      MODES.forEach(m => {
        if (!state.selectedModes.includes(m.id)) toggleMode(m.id);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
        <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleGradient}>
          <Text style={styles.headerTitle}>BETTERLO</Text>
        </LinearGradient>
        <Ionicons name="person-circle-outline" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>BUILD YOUR DECK</Text>
          <Text style={styles.pageTitle}>PICK YOUR{'\n'}<Text style={styles.pageTitleAccent}>DECKS</Text></Text>
          <Text style={styles.pageSubtitle}>
            Select one or more decks to mix into your game. Tap a deck to toggle it.
          </Text>
        </View>

        {/* Selected count pill */}
        <View style={styles.selectedBadgeRow}>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>
              {selectedCount === MODES.length
                ? 'ALL DECKS — FULL MIX'
                : `${selectedCount} DECK${selectedCount !== 1 ? 'S' : ''} SELECTED`}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
            <Text style={styles.selectAllText}>{allSelected ? 'RESET' : 'SELECT ALL'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modesList}>
          {MODES.map(mode => {
            const isSelected = state.selectedModes.includes(mode.id);
            const isLast = state.selectedModes.length === 1 && isSelected;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => toggleMode(mode.id)}
                activeOpacity={0.85}
                disabled={isLast} // can't deselect the last deck
              >
                <View style={[
                  styles.modeCard,
                  isSelected && {
                    borderColor: `${mode.color}50`,
                    shadowColor: mode.color,
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 4 },
                  },
                  !isSelected && styles.modeCardUnselected,
                ]}>
                  {isSelected && (
                    <LinearGradient
                      colors={[`${mode.color}10`, `${mode.color}20`]}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                  )}

                  {/* Background watermark */}
                  <View style={styles.modeWatermark}>
                    <Ionicons name={mode.icon as any} size={80} color={mode.color} style={{ opacity: isSelected ? 0.1 : 0.04 }} />
                  </View>

                  <View style={styles.modeRow}>
                    <View style={[styles.modeIconCircle, { backgroundColor: isSelected ? `${mode.color}18` : Colors.surfaceContainerHighest }]}>
                      <Ionicons name={mode.icon as any} size={22} color={isSelected ? mode.color : Colors.outline} />
                    </View>

                    <View style={styles.modeInfo}>
                      <Text style={[styles.modeLabel, { color: isSelected ? mode.color : Colors.onSurfaceVariant }]}>
                        {mode.label}
                      </Text>
                      <Text style={styles.modeDesc} numberOfLines={2}>{mode.desc}</Text>
                    </View>

                    {/* Checkbox */}
                    <View style={[
                      styles.checkbox,
                      isSelected
                        ? { backgroundColor: mode.color, borderColor: mode.color }
                        : { borderColor: Colors.outlineVariant },
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </View>

                  <View style={styles.modeTags}>
                    <View style={[styles.modeTag, { backgroundColor: isSelected ? `${mode.color}15` : Colors.surfaceContainerHighest }]}>
                      <Text style={[styles.modeTagText, { color: isSelected ? mode.color : Colors.outline }]}>{mode.intensity}</Text>
                    </View>
                    <View style={styles.modeTag}>
                      <Text style={styles.modeTagTextMuted}>{mode.time}</Text>
                    </View>
                    {isLast && (
                      <View style={styles.modeTag}>
                        <Text style={[styles.modeTagTextMuted, { color: Colors.outline }]}>MIN 1 DECK</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('Players')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.continueBtnInner}
          >
            <Text style={styles.continueBtnText}>CONTINUE WITH {selectedCount} DECK{selectedCount !== 1 ? 'S' : ''}</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.onPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav current="modes" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: 'rgba(14,14,17,0.9)',
  },
  titleGradient: { borderRadius: 4 },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 17, letterSpacing: -0.5, color: Colors.onPrimary, paddingHorizontal: 4,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  pageHeader: { marginTop: 24, marginBottom: 24 },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 4, color: Colors.primary,
    textTransform: 'uppercase', marginBottom: 8,
  },
  pageTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 48, letterSpacing: -2, lineHeight: 50, color: Colors.onSurface, marginBottom: 8,
  },
  pageTitleAccent: { color: Colors.primary },
  pageSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20,
  },
  selectedBadgeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectedBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  selectedBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 2, color: Colors.primary, textTransform: 'uppercase',
  },
  selectAllText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 2, color: Colors.onSurfaceVariant, textTransform: 'uppercase',
  },
  modesList: { gap: 10 },
  modeCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 16,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: 'transparent',
  },
  modeCardUnselected: {
    opacity: 0.6,
  },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  modeWatermark: { position: 'absolute', top: 8, right: 8 },
  modeIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  modeInfo: { flex: 1 },
  modeLabel: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 20, letterSpacing: -0.5, marginBottom: 4,
  },
  modeDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 12, color: Colors.onSurfaceVariant, lineHeight: 17,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 8, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modeTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeTag: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Colors.surfaceContainerHighest, borderRadius: 999,
  },
  modeTagText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  modeTagTextMuted: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.onSurfaceVariant,
  },
  continueBtn: { marginTop: 24 },
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