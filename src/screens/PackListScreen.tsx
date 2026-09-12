// src/screens/PackListScreen.tsx
// "My Decks" / "My Packs" for any scope. Everything mode-specific comes from
// the adapter.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';
import { livePackSize } from '../data/packs';
import { usePackLibrary } from '../hooks/usePackLibrary';
import { JackButton, JackIconButton } from '../components/jack';

type Props = NativeStackScreenProps<RootStackParamList, 'PackList'>;

export default function PackListScreen({ navigation, route }: Props) {
  const { scope } = route.params;
  const lib = usePackLibrary(scope);
  const { adapter } = lib;

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    const pack = await lib.createPack(name);
    setCreating(false);
    setName('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('PackEditor', { scope, packId: pack.id });
  };

  const handleDelete = (id: string, packName: string) => {
    Alert.alert(
      `Delete "${packName}"?`,
      `The ${adapter.itemNounPlural.toLowerCase()} inside it are kept in your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { lib.deletePack(id); } },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <JackIconButton icon="arrow-back" onPress={() => navigation.goBack()} size={42} />
        <Text style={styles.headerTitle}>MY {adapter.packNounPlural.toUpperCase()}</Text>
        <JackIconButton
          icon="add"
          onPress={() => { setName(''); setCreating(true); }}
          color={Colors.primary}
          iconColor={Colors.ink}
          size={42}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Build your own {adapter.packNounPlural.toLowerCase()} by mixing your
          {' '}{adapter.itemNounPlural.toLowerCase()} with the built-in ones.
        </Text>

        {lib.packs.length === 0 && !lib.loading && (
          <View style={styles.empty}>
            <Ionicons name="layers-outline" size={38} color={Colors.outlineVariant} />
            <Text style={styles.emptyText}>
              No {adapter.packNounPlural.toLowerCase()} yet. Tap + to make one.
            </Text>
          </View>
        )}

        {lib.packs.map(pack => {
          const size = livePackSize(pack, lib.items);
          return (
            <View key={pack.id} style={styles.rowOuter}>
              <View style={[styles.rowShadow, { backgroundColor: pack.color }]} />
              <View style={styles.rowFace}>
                <TouchableOpacity
                  style={styles.rowMain}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PackEditor', { scope, packId: pack.id })}
                >
                  <View style={[styles.icon, { backgroundColor: pack.color }]}>
                    <Ionicons name={pack.icon as never} size={18} color={Colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{pack.name}</Text>
                    <Text style={styles.rowSub}>
                      {size} {size === 1
                        ? adapter.itemNoun.toLowerCase()
                        : adapter.itemNounPlural.toLowerCase()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={Colors.outline} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(pack.id, pack.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.trash}
                >
                  <Ionicons name="trash-outline" size={17} color={Colors.onPaperDim} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.libraryLink}>
          <JackButton
            label={`Edit my ${adapter.itemNounPlural.toLowerCase()}`}
            variant="ghost"
            size="medium"
            iconLeft="create-outline"
            onPress={() => navigation.navigate('ItemLibrary', { scope })}
          />
        </View>
      </ScrollView>

      <Modal visible={creating} transparent animationType="slide"
        onRequestClose={() => setCreating(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New {adapter.packNoun}</Text>
            <View style={styles.inputOuter}>
              <View style={styles.inputShadow} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={`${adapter.packNoun} name`}
                placeholderTextColor={Colors.outline}
                maxLength={30}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
            </View>
            <View style={styles.sheetBtns}>
              <View style={{ flex: 1 }}>
                <JackButton label="Cancel" size="medium" variant="ghost"
                  onPress={() => setCreating(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <JackButton label="Create" size="medium" onPress={handleCreate} />
              </View>
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
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: Type.display, fontSize: 13, letterSpacing: 2,
    color: Colors.onSurfaceVariant,
  },
  list: { padding: 20, gap: 12 },
  intro: {
    fontFamily: Type.body, fontSize: 13, lineHeight: 19,
    color: Colors.onSurfaceVariant, marginBottom: 4,
  },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: {
    fontFamily: Type.body, fontSize: 13.5, color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },

  rowOuter: { position: 'relative' },
  rowShadow: {
    position: 'absolute', top: 5, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius,
  },
  rowFace: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Jack.radius, borderWidth: Jack.border, borderColor: Colors.ink,
    backgroundColor: Colors.surfaceContainerLow,
    paddingRight: 12, marginBottom: 5,
  },
  rowMain: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
  },
  icon: {
    width: 38, height: 38, borderRadius: 10,
    borderWidth: 2.5, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTitle: { fontFamily: Type.display, fontSize: 15, color: Colors.onSurface },
  rowSub: {
    fontFamily: Type.bodyMedium, fontSize: 12,
    color: Colors.onSurfaceVariant, marginTop: 2,
  },
  trash: { padding: 6 },

  libraryLink: { marginTop: 18 },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,6,32,0.72)' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
    padding: 22, paddingBottom: 32, gap: 14,
  },
  sheetTitle: { fontFamily: Type.display, fontSize: 19, color: Colors.onSurface },
  sheetBtns: { flexDirection: 'row', gap: 12 },

  inputOuter: { position: 'relative' },
  inputShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: Jack.radius, backgroundColor: Colors.ink,
  },
  input: {
    height: 48, borderRadius: Jack.radius, paddingHorizontal: 14, marginBottom: 4,
    backgroundColor: Colors.surfaceContainer, color: Colors.onSurface,
    fontFamily: Type.bodyMedium, fontSize: 14,
    borderWidth: Jack.border, borderColor: Colors.ink,
  },
});
