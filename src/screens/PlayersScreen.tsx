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
import { Colors } from '../styles/theme';
import { MODES } from '../data/gameData';
import { useGame } from '../components/GameContext';
import { BottomNav } from './WelcomeScreen';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Players'>;
};

const BONUS_STEPS = [0, 1, 2, 3] as const;
const BONUS_LABELS = ['standard', '+1', '+2', '+3'] as const;
const BONUS_DISPLAY = ['Standard', '+1 sip', '+2 sips', '+3 sips'] as const;

export default function PlayersScreen({ navigation }: Props) {
  const { state, addPlayer, removePlayer, updatePlayerPhoto, startGame, toggleMode, setSipBonus } = useGame();
  const [inputValue, setInputValue] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bonusAnim = useRef(new Animated.Value(state.sipBonus)).current;

  const handleAdd = () => {
    if (!inputValue.trim()) return;
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
    Animated.spring(bonusAnim, {
      toValue: value,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const canStart = state.players.length >= 2;
  const firstMode = MODES.find(m => state.selectedModes.includes(m.id)) ?? MODES[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
        <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.titleGradient}>
          <Text style={styles.headerTitle}>NEKKIT</Text>
        </LinearGradient>
        <Ionicons name="person-circle-outline" size={24} color={Colors.onSurface} style={{ opacity: 0.7 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>WHO'S{'\n'}<Text style={styles.pageTitleAccent}>IN?</Text></Text>
          <Text style={styles.pageSubtitle}>Enter the legends joining the night.</Text>
        </View>

        {/* Input row */}
        <Animated.View style={[styles.inputRow, { transform: [{ translateX: shakeAnim }] }]}>
          <TextInput
            style={styles.input}
            placeholder="Type player name..."
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

        {/* Player list header */}
        <View style={styles.listHeader}>
          <Text style={styles.listLabel}>Active Party</Text>
          <Text style={styles.playerCount}>{String(state.players.length).padStart(2, '0')}</Text>
        </View>

        {/* Players */}
        {state.players.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>Add at least 2 players to start the game.</Text>
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

        {/* Deck selector */}
        {canStart && (
          <View style={styles.modeSelectorSection}>
            <Text style={styles.modeSelectorEyebrow}>ACTIVE DECKS</Text>
            <View style={styles.deckChipsRow}>
              {MODES.map(mode => {
                const active = state.selectedModes.includes(mode.id);
                const isLast = state.selectedModes.length === 1 && active;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      if (isLast) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleMode(mode.id);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.deckChip,
                      active
                        ? { backgroundColor: `${mode.color}20`, borderColor: `${mode.color}60` }
                        : { borderColor: Colors.outlineVariant },
                    ]}
                  >
                    <Ionicons name={mode.icon as any} size={14} color={active ? mode.color : Colors.outline} />
                    <Text style={[styles.deckChipText, { color: active ? mode.color : Colors.outline }]}>
                      {mode.label}
                    </Text>
                    {active && <Ionicons name="checkmark" size={12} color={mode.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Modes')}
              activeOpacity={0.7}
              style={styles.manageDeckBtn}
            >
              <Ionicons name="options-outline" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.manageDeckText}>MANAGE DECKS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sip bonus selector */}
        {canStart && (() => {
          const STEP_WIDTH = 200 / BONUS_STEPS.length;
          const pillTranslateX = bonusAnim.interpolate({
            inputRange: [0, BONUS_STEPS.length - 1],
            outputRange: [0, STEP_WIDTH * (BONUS_STEPS.length - 1)],
          });
          return (
            <View style={styles.bonusSection}>
              <View style={styles.bonusHeader}>
                <Text style={styles.bonusEyebrow}>DRINK STRENGTH</Text>
                <Text style={[styles.bonusValue, { color: firstMode.color }]}>
                  {BONUS_DISPLAY[state.sipBonus]}
                </Text>
              </View>
              <View style={[styles.bonusTrack, { borderColor: `${firstMode.color}20` }]}>
                <Animated.View
                  style={[
                    styles.bonusPill,
                    { width: STEP_WIDTH, backgroundColor: firstMode.color, transform: [{ translateX: pillTranslateX }] },
                  ]}
                />
                {BONUS_STEPS.map(step => (
                  <TouchableOpacity
                    key={step}
                    style={styles.bonusStep}
                    onPress={() => handleBonusChange(step)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.bonusStepLabel,
                      state.sipBonus === step && { color: Colors.onPrimary, fontFamily: 'PlusJakartaSans_800ExtraBold' },
                    ]}>
                      {BONUS_LABELS[step]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.bonusHint}>
                {state.sipBonus === 0
                  ? 'Cards play at their base sip values.'
                  : `Every sip value on every card is increased by ${state.sipBonus}.`}
              </Text>
            </View>
          );
        })()}

        {/* Start button */}
        {canStart && (
          <TouchableOpacity onPress={handleStart} activeOpacity={0.85} style={styles.startBtnWrapper}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.startBtn}
            >
              <Text style={styles.startBtnText}>LET'S GO</Text>
              <Ionicons name="arrow-forward" size={22} color={Colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BottomNav current="players" navigation={navigation} />
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
  pageHeader: { marginTop: 32, marginBottom: 32 },
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
    fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 8,
  },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 15, color: Colors.onSurface,
  },
  addBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: 16,
  },
  listLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline,
  },
  playerCount: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 28, color: Colors.primary,
  },
  emptyState: {
    borderWidth: 1, borderColor: 'rgba(72,71,75,0.3)', borderStyle: 'dashed',
    borderRadius: 16, padding: 40,
    alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: 'rgba(37,37,42,0.2)',
  },
  emptyText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.outline, textAlign: 'center',
  },
  playerList: { gap: 10 },
  playerCard: {
    borderRadius: 16, padding: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  orbWrapper: { position: 'relative' },
  playerOrb: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, overflow: 'hidden',
  },
  playerPhoto: { width: 56, height: 56, borderRadius: 28 },
  playerInitial: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 22 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  playerName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16, color: Colors.onSurface, letterSpacing: -0.5,
  },
  playerRank: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2,
  },
  removeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },

  // Deck selector
  modeSelectorSection: { marginTop: 32 },
  modeSelectorEyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
    color: Colors.outline, marginBottom: 12,
  },
  deckChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  deckChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
    backgroundColor: Colors.surfaceContainerLow,
  },
  deckChipText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
  },
  manageDeckBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  manageDeckText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: Colors.onSurfaceVariant,
  },

  // Bonus selector
  bonusSection: { marginTop: 24 },
  bonusHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
  },
  bonusEyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline,
  },
  bonusValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 22,
  },
  bonusTrack: {
    height: 52, borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    flexDirection: 'row', overflow: 'hidden', position: 'relative',
  },
  bonusPill: {
    position: 'absolute', top: 0, bottom: 0, borderRadius: 14,
  },
  bonusStep: {
    flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  bonusStepLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13, color: Colors.onSurfaceVariant,
  },
  bonusHint: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11, color: Colors.outline, marginTop: 8, textAlign: 'center',
  },

  startBtnWrapper: { marginTop: 16 },
  startBtn: {
    paddingVertical: 20, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  startBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 20, letterSpacing: 2, color: Colors.onPrimary, textTransform: 'uppercase',
  },
});