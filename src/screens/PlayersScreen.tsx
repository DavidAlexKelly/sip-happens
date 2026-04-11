import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, Modal, Image,
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

const MULTIPLIER_STEPS = [1, 2, 3, 4] as const;

export default function PlayersScreen({ navigation }: Props) {
  const { state, addPlayer, removePlayer, updatePlayerPhoto, startGame, setMode, setSipMultiplier } = useGame();
  const [inputValue, setInputValue] = useState('');
  const [showModeModal, setShowModeModal] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const multiplierAnim = useRef(new Animated.Value(state.sipMultiplier - 1)).current;

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
      aspect: [1, 1], // square crop to fit the circular orb
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

  const handleSelectMode = (id: string) => {
    setMode(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowModeModal(false);
  };

  const handleMultiplierChange = (value: 1 | 2 | 3 | 4) => {
    if (value === state.sipMultiplier) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSipMultiplier(value);
    Animated.spring(multiplierAnim, {
      toValue: value - 1,
      tension: 120,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const canStart = state.players.length >= 2;
  const activeMode = MODES.find(m => m.id === state.selectedMode) ?? MODES[MODES.length - 1];

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page heading */}
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
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={24} color={Colors.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Player list header */}
        <View style={styles.listHeader}>
          <Text style={styles.listLabel}>Active Party</Text>
          <Text style={styles.playerCount}>
            {String(state.players.length).padStart(2, '0')}
          </Text>
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
                  {/* Orb / photo — tap to open camera */}
                  <TouchableOpacity
                    onPress={() => handleTakePhoto(player.id)}
                    activeOpacity={0.8}
                    style={styles.orbWrapper}
                  >
                    <View style={[styles.playerOrb, { borderColor: player.color }]}>
                      {player.photo ? (
                        <Image source={{ uri: player.photo }} style={styles.playerPhoto} />
                      ) : (
                        <Text style={[styles.playerInitial, { color: player.color }]}>
                          {player.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    {/* Camera badge */}
                    <View style={[styles.cameraBadge, { backgroundColor: player.color }]}>
                      <Ionicons name="camera" size={10} color={Colors.background} />
                    </View>
                  </TouchableOpacity>

                  <View>
                    <Text style={styles.playerName}>{player.name.toUpperCase()}</Text>
                    <Text style={[styles.playerRank, { color: player.color }]}>{player.rank}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleRemove(player.id)}
                  style={styles.removeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color={Colors.outlineVariant} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}


        {/* Mode selector */}
        {canStart && (
          <View style={styles.modeSelectorSection}>
            <Text style={styles.modeSelectorEyebrow}>GAME MODE</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowModeModal(true)}
              style={styles.modeSelectorCard}
            >
              <View style={[styles.modeSelectorTint, { backgroundColor: `${activeMode.color}10` }]} />
              <View style={styles.modeSelectorLeft}>
                <View style={[styles.modeSelectorIcon, { backgroundColor: `${activeMode.color}18` }]}>
                  <Ionicons name={activeMode.icon as any} size={20} color={activeMode.color} />
                </View>
                <View>
                  <Text style={[styles.modeSelectorLabel, { color: activeMode.color }]}>
                    {activeMode.label}
                  </Text>
                  <Text style={styles.modeSelectorDesc} numberOfLines={1}>
                    {activeMode.desc}
                  </Text>
                </View>
              </View>
              <View style={styles.modeSelectorChevron}>
                <Text style={[styles.modeSelectorChangeText, { color: activeMode.color }]}>CHANGE</Text>
                <Ionicons name="chevron-forward" size={14} color={activeMode.color} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Drink multiplier */}
        {canStart && (() => {
          const STEP_WIDTH = 200 / MULTIPLIER_STEPS.length;
          const pillTranslateX = multiplierAnim.interpolate({
            inputRange: [0, MULTIPLIER_STEPS.length - 1],
            outputRange: [0, STEP_WIDTH * (MULTIPLIER_STEPS.length - 1)],
          });
          return (
            <View style={styles.multiplierSection}>
              <View style={styles.multiplierHeader}>
                <Text style={styles.multiplierEyebrow}>DRINK STRENGTH</Text>
                <Text style={[styles.multiplierValue, { color: activeMode.color }]}>×{state.sipMultiplier}</Text>
              </View>
              <View style={[styles.multiplierTrack, { borderColor: `${activeMode.color}20` }]}>
                <Animated.View
                  style={[
                    styles.multiplierPill,
                    { width: STEP_WIDTH, backgroundColor: activeMode.color, transform: [{ translateX: pillTranslateX }] },
                  ]}
                />
                {MULTIPLIER_STEPS.map(step => (
                  <TouchableOpacity
                    key={step}
                    style={styles.multiplierStep}
                    onPress={() => handleMultiplierChange(step)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.multiplierStepLabel,
                      state.sipMultiplier === step && { color: Colors.onPrimary, fontFamily: 'PlusJakartaSans_800ExtraBold' },
                    ]}>
                      {step}×
                    </Text>
                    <Text style={[
                      styles.multiplierStepSub,
                      state.sipMultiplier === step && { color: Colors.onPrimary, opacity: 0.8 },
                    ]}>
                      {step === 1 ? 'normal' : step === 2 ? 'double' : step === 3 ? 'triple' : 'quad'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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

      {/* Mode picker modal */}
      <Modal visible={showModeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Mode</Text>
            <Text style={styles.modalSubtitle}>Set the vibe before the night begins.</Text>
            <View style={styles.modeList}>
              {MODES.map(mode => {
                const isSelected = state.selectedMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectMode(mode.id)}
                    style={[
                      styles.modeRow,
                      isSelected && { backgroundColor: `${mode.color}10`, borderColor: `${mode.color}30` },
                    ]}
                  >
                    <View style={[styles.modeRowIcon, { backgroundColor: `${mode.color}18` }]}>
                      <Ionicons name={mode.icon as any} size={18} color={mode.color} />
                    </View>
                    <View style={styles.modeRowText}>
                      <Text style={[styles.modeRowLabel, { color: isSelected ? mode.color : Colors.onSurface }]}>
                        {mode.label}
                      </Text>
                      <Text style={styles.modeRowDesc} numberOfLines={1}>{mode.desc}</Text>
                    </View>
                    <View style={styles.modeRowRight}>
                      <Text style={[styles.modeRowIntensity, { color: mode.color }]}>{mode.intensity}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={mode.color} style={{ marginTop: 4 }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.modalDismiss}
              onPress={() => setShowModeModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalDismissText}>CANCEL</Text>
            </TouchableOpacity>
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

  // Orb + badge
  orbWrapper: { position: 'relative' },
  playerOrb: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, overflow: 'hidden',
  },
  playerPhoto: { width: 56, height: 56, borderRadius: 28 },
  playerInitial: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
  },
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
  inviteSlot: {
    marginTop: 16, borderWidth: 1, borderColor: 'rgba(72,71,75,0.25)',
    borderStyle: 'dashed', borderRadius: 16, padding: 24,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(37,37,42,0.15)',
  },
  inviteText: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.outline,
  },

  // Mode selector
  modeSelectorSection: { marginTop: 32 },
  modeSelectorEyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
    color: Colors.outline, marginBottom: 10,
  },
  modeSelectorCard: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1, borderColor: 'rgba(72,71,75,0.25)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  modeSelectorTint: { ...StyleSheet.absoluteFillObject },
  modeSelectorLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeSelectorIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  modeSelectorLabel: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 17, letterSpacing: -0.5,
  },
  modeSelectorDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2, maxWidth: 180,
  },
  modeSelectorChevron: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modeSelectorChangeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
  },

  multiplierSection: { marginTop: 24 },
  multiplierHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10,
  },
  multiplierEyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: Colors.outline,
  },
  multiplierValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    fontSize: 22,
  },
  multiplierTrack: {
    height: 52, borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    flexDirection: 'row', overflow: 'hidden', position: 'relative',
  },
  multiplierPill: {
    position: 'absolute', top: 0, bottom: 0, borderRadius: 14,
  },
  multiplierStep: {
    flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1, gap: 2,
  },
  multiplierStepLabel: {
    fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: Colors.onSurfaceVariant,
  },
  multiplierStepSub: {
    fontFamily: 'BeVietnamPro_400Regular', fontSize: 9, color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5,
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

  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, gap: 4,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22, color: Colors.onSurface, marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 20,
  },
  modeList: { gap: 8 },
  modeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1, borderColor: 'transparent',
    backgroundColor: Colors.surfaceContainerLow,
  },
  modeRowIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  modeRowText: { flex: 1 },
  modeRowLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14, letterSpacing: -0.3,
  },
  modeRowDesc: {
    fontFamily: 'BeVietnamPro_400Regular',
    fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2,
  },
  modeRowRight: { alignItems: 'flex-end' },
  modeRowIntensity: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  modalDismiss: {
    marginTop: 16, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest,
  },
  modalDismissText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: Colors.onSurfaceVariant,
  },
});