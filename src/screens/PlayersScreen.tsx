// src/screens/PlayersScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/types';
import { Colors, Type } from '../styles/theme';
import { MODES } from '../data/gameData';
import { useGame } from '../components/GameContext';
import Logo from '../components/Logo';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Players'>;
};

const BONUS_STEPS = [0, 1, 2, 3] as const;
const BONUS_DISPLAY = ['Standard', '+1 sip', '+2 sips', '+3 sips'] as const;

export default function PlayersScreen({ navigation }: Props) {
  const { state, addPlayer, removePlayer, updatePlayerPhoto, startGame, toggleMode, setSipBonus } = useGame();
  const [inputValue, setInputValue] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleAdd = () => {
    if (!inputValue.trim()) { shake(); return; }
    addPlayer(inputValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputValue('');
  };

  const handleRemove = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removePlayer(id);
  };

  const handleTakePhoto = async (playerId: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      updatePlayerPhoto(playerId, result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleStart = () => {
    if (state.players.length < 2) return;
    startGame();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Game');
  };

  const handleBonusChange = (value: 0 | 1 | 2 | 3) => {
    if (value === state.sipBonus) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSipBonus(value);
  };

  const canStart = state.players.length >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Logo />
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>WHO'S{'\n'}<Text style={styles.pageTitleAccent}>IN?</Text></Text>
          <Text style={styles.pageSubtitle}>Add everyone at the table.</Text>
        </View>

        <Animated.View style={[styles.inputRow, { transform: [{ translateX: shakeAnim }] }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a name..."
            placeholderTextColor={Colors.outline}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            maxLength={20}
            autoCapitalize="words"
          />
          <TouchableOpacity onPress={handleAdd} activeOpacity={0.8}>
            <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} style={styles.addBtn}>
              <Ionicons name="add" size={24} color={Colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.listHeader}>
          <Text style={styles.listLabel}>At the Table</Text>
          <Text style={styles.playerCount}>{String(state.players.length).padStart(2, '0')}</Text>
        </View>

        {state.players.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>Add at least 2 players to start.</Text>
          </View>
        ) : (
          <View style={styles.playerList}>
            {state.players.map((player, i) => (
              <View
                key={player.id}
                style={[
                  styles.playerCard,
                  { backgroundColor: i % 2 === 0 ? Colors.surfaceContainerLow : Colors.surfaceContainer },
                ]}
              >
                <View style={styles.playerLeft}>
                  <TouchableOpacity onPress={() => handleTakePhoto(player.id)} activeOpacity={0.8} style={styles.orbWrapper}>
                    <View style={[styles.playerOrb, { borderColor: player.color }]}>
                      {player.photo ? (
                        <Image source={{ uri: player.photo }} style={styles.playerPhoto} />
                      ) : (
                        <Text style={[styles.playerInitial, { color: player.color }]}>
                          {player.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.cameraBadge, { backgroundColor: player.color }]}>
                      <Ionicons name="camera" size={10} color={Colors.background} />
                    </View>
                  </TouchableOpacity>
                  <View>
                    <Text style={styles.playerName}>{player.name.toUpperCase()}</Text>
                    <Text style={[styles.playerRank, { color: player.color }]}>{player.rank}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemove(player.id)} style={styles.removeBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color={Colors.outlineVariant} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {canStart && (
          <>
            {/* Deck chips */}
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>ACTIVE DECKS</Text>
              <View style={styles.deckChipsRow}>
                {MODES.map(mode => {
                  const active = state.selectedModes.includes(mode.id);
                  const isLast = state.selectedModes.length === 1 && active;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      onPress={() => { if (!isLast) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleMode(mode.id); } }}
                      activeOpacity={0.8}
                      style={[
                        styles.deckChip,
                        active
                          ? { backgroundColor: `${mode.color}22`, borderColor: mode.color }
                          : { borderColor: Colors.outlineVariant },
                      ]}
                    >
                      <Text style={[styles.deckChipText, active && { color: mode.color }]}>{mode.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sip bonus stepper */}
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>SIP INTENSITY</Text>
              <View style={styles.bonusRow}>
                {BONUS_STEPS.map(step => {
                  const active = state.sipBonus === step;
                  return (
                    <TouchableOpacity
                      key={step}
                      onPress={() => handleBonusChange(step)}
                      activeOpacity={0.8}
                      style={[styles.bonusPill, active && styles.bonusPillActive]}
                    >
                      <Text style={[styles.bonusPillText, active && styles.bonusPillTextActive]}>
                        {BONUS_DISPLAY[step]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleStart} activeOpacity={0.88} disabled={!canStart}>
          <LinearGradient
            colors={canStart ? [Colors.primary, Colors.primaryContainer] : [Colors.surfaceContainerHigh, Colors.surfaceContainerHigh]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.startBtn}
          >
            <Text style={[styles.startBtnText, !canStart && { color: Colors.outline }]}>
              {canStart ? 'START GAME' : 'ADD 2+ PLAYERS'}
            </Text>
            {canStart && <Ionicons name="play" size={18} color={Colors.onPrimary} />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  pageHeader: { marginTop: 8, marginBottom: 24 },
  pageTitle: { fontFamily: Type.display, fontSize: 38, lineHeight: 40, color: Colors.onSurface },
  pageTitleAccent: { color: Colors.primary },
  pageSubtitle: { fontFamily: Type.body, fontSize: 15, color: Colors.onSurfaceVariant, marginTop: 8 },

  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  input: {
    flex: 1, height: 52, borderRadius: 16, paddingHorizontal: 18,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 15,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  addBtn: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  listLabel: { fontFamily: Type.bodyBold, fontSize: 12, letterSpacing: 1.5, color: Colors.outline, textTransform: 'uppercase' },
  playerCount: { fontFamily: Type.display, fontSize: 16, color: Colors.onSurfaceVariant },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40, opacity: 0.7 },
  emptyText: { fontFamily: Type.body, fontSize: 14, color: Colors.onSurfaceVariant },

  playerList: { gap: 8 },
  playerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, padding: 12,
  },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orbWrapper: { position: 'relative' },
  playerOrb: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  playerPhoto: { width: '100%', height: '100%' },
  playerInitial: { fontFamily: Type.display, fontSize: 17 },
  cameraBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background,
  },
  playerName: { fontFamily: Type.bodyBold, fontSize: 14, color: Colors.onSurface, letterSpacing: 0.5 },
  playerRank: { fontFamily: Type.bodyMedium, fontSize: 12, marginTop: 2 },
  removeBtn: { padding: 6 },

  section: { marginTop: 28 },
  sectionEyebrow: {
    fontFamily: Type.bodyBold, fontSize: 11, letterSpacing: 2, color: Colors.outline,
    textTransform: 'uppercase', marginBottom: 12,
  },
  deckChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deckChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1 },
  deckChipText: { fontFamily: Type.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant },

  bonusRow: { flexDirection: 'row', gap: 8 },
  bonusPill: {
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
    backgroundColor: Colors.surfaceContainer, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  bonusPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  bonusPillText: { fontFamily: Type.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant },
  bonusPillTextActive: { color: Colors.onPrimary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 34,
    backgroundColor: 'rgba(12,10,18,0.95)',
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
  startBtn: {
    height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  startBtnText: { fontFamily: Type.display, fontSize: 15, letterSpacing: 1.5, color: Colors.onPrimary },
});