// src/components/RingContext.tsx
// Setup settings for Ring of Fire, persisted between sessions.
// Runtime game state lives in useRingEngine; this is only what setup chooses.

import React, {
  createContext, useContext, useEffect, useRef, useState, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CLASSIC_SET_ID } from '../data/ringSets';
import { loadActiveSetId, saveActiveSetId } from '../data/ringSetStorage';

export interface RingSettings {
  /**
   * true (classic): the game ends when the last King is drawn and that player
   * downs the middle glass. false: keep going through all 52 cards.
   */
  endOnLastKing: boolean;
}

const DEFAULTS: RingSettings = {
  endOnLastKing: true,
};

const PERSIST_KEY = '@siphappens_ring_v1';

interface RingContextType {
  settings: RingSettings;
  setEndOnLastKing: (on: boolean) => void;
  /** Id of the rule set in play. */
  activeSetId: string;
  setActiveSetId: (id: string) => void;
  resetSettings: () => void;
}

const RingContext = createContext<RingContextType | null>(null);

export function RingProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RingSettings>(DEFAULTS);
  const [activeSetId, setActiveSetIdState] = useState<string>(CLASSIC_SET_ID);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PERSIST_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<RingSettings>;
          setSettings({
            endOnLastKing: typeof saved.endOnLastKing === 'boolean'
              ? saved.endOnLastKing
              : DEFAULTS.endOnLastKing,
          });
        }
      } catch { /* corrupt or missing — defaults are fine */ }
      setActiveSetIdState(await loadActiveSetId());
      hydrated.current = true;
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  const setActiveSetId = (id: string) => {
    setActiveSetIdState(id);
    saveActiveSetId(id).catch(() => {});
  };

  const setEndOnLastKing = (on: boolean) =>
    setSettings(prev => ({ ...prev, endOnLastKing: on }));

  const resetSettings = () => setSettings(DEFAULTS);

  return (
    <RingContext.Provider value={{ settings, setEndOnLastKing, activeSetId, setActiveSetId, resetSettings }}>
      {children}
    </RingContext.Provider>
  );
}

export function useRing() {
  const ctx = useContext(RingContext);
  if (!ctx) throw new Error('useRing must be used inside RingProvider');
  return ctx;
}
