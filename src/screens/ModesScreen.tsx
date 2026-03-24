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
  const { state, setMode } = useGame();

  const handleSelect = (id: string) => {
    setMode(id);
    setTimeout(() => navigation.navigate('Players'), 250);
  };

  const handleSurprise = () => {
    const options = MODES.filter(m => m.id !== 'all');
    const pick = options[Math.floor(Math.random() * options.length)];
    setMode(pick.id);
    setTimeout(() => navigation.navigate('Players'), 250);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
        <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleGradient}>
          <Text style={styles.headerTitle}>ELECTRIC NOCTURNE</Text>
        </LinearGradient>
        <Ionicons name="person-circle-outline" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>CHOOSE YOUR VIBE</Text>
          <Text style={styles.pageTitle}>MATCH THE{'\n'}<Text style={styles.pageTitleAccent}>ENERGY</Text></Text>
          <Text style={styles.pageSubtitle}>Select a challenge pack to set the tone.</Text>
        </View>

        <View style={styles.modesList}>
          {MODES.map(mode => {
            const isSelected = state.selectedMode === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => handleSelect(mode.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.modeCard, isSelected && { shadowColor: mode.color, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }]}>
                  {isSelected && (
                    <LinearGradient
                      colors={[`${mode.color}08`, `${mode.color}18`]}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                  )}
                  {/* Background watermark icon */}
                  <View style={styles.modeWatermark}>
                    <Ionicons name={mode.icon as any} size={80} color={mode.color} style={{ opacity: 0.1 }} />
                  </View>

                  <View style={styles.modeIconCircle}>
                    <Ionicons name={mode.icon as any} size={22} color={mode.color} />
                  </View>
                  <Text style={styles.modeLabel}>{mode.label}</Text>
                  <Text style={styles.modeDesc}>{mode.desc}</Text>
                  <View style={styles.modeTags}>
                    <View style={styles.modeTag}>
                      <Text style={[styles.modeTagText, { color: mode.color }]}>{mode.intensity}</Text>
                    </View>
                    <View style={styles.modeTag}>
                      <Text style={styles.modeTagTextMuted}>{mode.time}</Text>
                    </View>
                    {isSelected && (
                      <View style={{ marginLeft: 'auto' }}>
                        <Ionicons name="checkmark-circle" size={20} color={mode.color} />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Randomiser */}
        <View style={styles.randomiser}>
          <Text style={styles.randomiserLabel}>Can't decide? Try our randomizer.</Text>
          <View style={styles.randomiserRow}>
            <TouchableOpacity style={styles.randomiserBtn} onPress={() => navigation.navigate('Players')}>
              <Text style={styles.randomiserBtnTextMuted}>QUICK PLAY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.randomiserBtn, styles.randomiserBtnActive]} onPress={handleSurprise}>
              <Text style={[styles.randomiserBtnText, { color: Colors.secondary }]}>SURPRISE ME</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  pageHeader: { marginTop: 24, marginBottom: 32 },
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
    fontSize: 14, color: Colors.onSurfaceVariant,
  },
  modesList: { gap: 12 },
  modeCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16, padding: 24, overflow: 'hidden', position: 'relative',
  },
  modeWatermark: { position: 'absolute', top: 8, right: 8 },
  modeIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  modeLabel: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 24, letterSpacing: -1, color: Colors.onSurface, marginBottom: 8,
  },
  modeDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19, marginBottom: 16,
  },
  modeTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeTag: {
    paddingHorizontal: 12, paddingVertical: 4,
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
  randomiser: { marginTop: 40, alignItems: 'center' },
  randomiserLabel: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 16,
  },
  randomiserRow: {
    flexDirection: 'row', backgroundColor: Colors.surfaceContainer,
    borderRadius: 999, padding: 4,
  },
  randomiserBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  randomiserBtnActive: { backgroundColor: Colors.surfaceContainerHighest },
  randomiserBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
  },
  randomiserBtnTextMuted: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: Colors.onSurfaceVariant,
  },
});
