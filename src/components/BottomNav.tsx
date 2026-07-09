// src/components/BottomNav.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Type } from '../styles/theme';

type Props = {
  current: 'play' | 'decks' | 'cards';
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
};

const TABS = [
  { id: 'play',  label: 'PLAY',  icon: 'game-controller', screen: 'Play'  },
  { id: 'decks', label: 'DECKS', icon: 'layers',           screen: 'Decks' },
  { id: 'cards', label: 'CARDS', icon: 'card',             screen: 'Cards' },
] as const;

export default function BottomNav({ current, navigation }: Props) {
  return (
    <View style={styles.navContainer}>
      {TABS.map(tab => {
        const isActive = tab.id === current;
        if (isActive) {
          return (
            <View key={tab.id} style={styles.navItemActive}>
              <Ionicons name={tab.icon as any} size={22} color={Colors.onPrimary} />
              <Text style={[styles.navLabel, styles.navLabelActive]}>{tab.label}</Text>
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => navigation.navigate(tab.screen as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon as any} size={22} color={Colors.onSurface} style={{ opacity: 0.4 }} />
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
    paddingTop: 12, paddingBottom: 32, paddingHorizontal: 16,
    backgroundColor: 'rgba(12,10,18,0.95)',
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  navItemActive: {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 999, gap: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  navItem: {
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 10, gap: 2,
  },
  navLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 8, letterSpacing: 1.5, color: Colors.onSurface, textTransform: 'uppercase', opacity: 0.4,
  },
  navLabelActive: {
    color: Colors.onPrimary, opacity: 1,
  },
});