// src/components/BottomNav.tsx
// Jackbox ticket bar: a raised stage-panel strip with a thick ink top border.
// The active tab is a tilted buzzer-yellow sticker; inactive tabs are quiet.
// Same props API as before.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Jack, Type } from '../styles/theme';

type Props = {
  current: 'play' | 'decks' | 'cards';
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
};

const TABS = [
  { id: 'play',  label: 'PLAY',  icon: 'game-controller', screen: 'Play'  },
  { id: 'decks', label: 'DECKS', icon: 'layers',          screen: 'Decks' },
  { id: 'cards', label: 'CARDS', icon: 'card',            screen: 'Cards' },
] as const;

const TILTS = ['-1.5deg', '1.2deg', '-1.2deg'];

export default function BottomNav({ current, navigation }: Props) {
  return (
    <View style={styles.navContainer}>
      {TABS.map((tab, i) => {
        const isActive = tab.id === current;
        if (isActive) {
          return (
            <View key={tab.id} style={[styles.activeOuter, { transform: [{ rotate: TILTS[i] }] }]}>
              <View style={styles.activeShadow} />
              <View style={styles.activeFace}>
                <Ionicons name={tab.icon as any} size={20} color={Colors.ink} />
                <Text style={styles.activeLabel}>{tab.label}</Text>
              </View>
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => {
              Haptics.selectionAsync();
              navigation.navigate(tab.screen as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon as any} size={22} color={Colors.onSurfaceVariant} />
            <Text style={styles.navLabel}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 12, paddingBottom: 30, paddingHorizontal: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderTopWidth: Jack.border, borderTopColor: Colors.ink,
  },
  navItem: {
    alignItems: 'center', justifyContent: 'center',
    padding: 10, gap: 3,
  },
  navLabel: {
    fontFamily: Type.display,
    fontSize: 9, letterSpacing: 1.5, color: Colors.onSurfaceVariant,
  },
  activeOuter: { position: 'relative' },
  activeShadow: {
    position: 'absolute', top: 4, left: 0, right: 0, bottom: 0,
    borderRadius: 14, backgroundColor: Colors.ink,
  },
  activeFace: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 14, borderWidth: Jack.border, borderColor: Colors.ink,
    backgroundColor: Colors.primary,
    marginBottom: 4,
  },
  activeLabel: {
    fontFamily: Type.display, fontSize: 12, letterSpacing: 1.2, color: Colors.ink,
  },
});
