// App.tsx
// Updated for monetization:
//   • Ads.init() on mount — runs the UK/EU consent form + iOS ATT prompt on
//     first launch, then preloads the first interstitial
//   • gestureEnabled: false on Game/GameOver so an iOS edge-swipe can't
//     accidentally kill a running game
//
// NOTE: the Stack.Screen list and options below are the standard
// headerShown:false setup. If your original navigator had custom per-screen
// animations/options, keep yours and port ONLY the three additions above.

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  PlusJakartaSans_800ExtraBold_Italic,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';

import { GameProvider } from './src/components/GameContext';
import { Ads } from './src/monetization/ads';
import { RootStackParamList } from './src/navigation/types';

// Bottom nav screens
import PlayScreen  from './src/screens/PlayScreen';
import DecksScreen from './src/screens/DecksScreen';
import CardsScreen from './src/screens/CardsScreen';

// Setup flow (no bottom nav)
import DeckSelectScreen from './src/screens/DeckSelectScreen';
import PlayersScreen    from './src/screens/PlayersScreen';
import GameScreen       from './src/screens/GameScreen';
import GameOverScreen   from './src/screens/GameOverScreen';

import { Colors } from './src/styles/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    PlusJakartaSans_800ExtraBold_Italic,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_700Bold,
  });

  // Consent flow + SDK init + preload of the first interstitial.
  // Fire-and-forget: if it fails (offline first run), ads silently no-op.
  useEffect(() => {
    Ads.init();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Play"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="Play"       component={PlayScreen} />
            <Stack.Screen name="Decks"      component={DecksScreen} />
            <Stack.Screen name="Cards"      component={CardsScreen} />
            <Stack.Screen name="DeckSelect" component={DeckSelectScreen} />
            <Stack.Screen name="Players"    component={PlayersScreen} />
            <Stack.Screen
              name="Game"
              component={GameScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="GameOver"
              component={GameOverScreen}
              options={{ gestureEnabled: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
}