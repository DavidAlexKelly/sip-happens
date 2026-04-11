import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PlayerColors, PlayerRanks } from '../styles/theme';

export interface Player {
  id: number;
  name: string;
  color: string;
  rank: string;
  photo?: string;
}

interface GameState {
  players: Player[];
  selectedModes: string[];
  currentRound: number;
  totalRounds: number;
  skips: number;
  usedChallenges: Set<string>;
  sipMultiplier: 1 | 2 | 3 | 4;
}

interface GameContextType {
  state: GameState;
  addPlayer: (name: string) => void;
  removePlayer: (id: number) => void;
  updatePlayerPhoto: (id: number, uri: string) => void;
  toggleMode: (mode: string) => void;
  setSipMultiplier: (multiplier: 1 | 2 | 3 | 4) => void;
  startGame: () => void;
  nextRound: () => void;
  skipRound: () => void;
  resetGame: () => void;
}

const defaultState: GameState = {
  players: [],
  selectedModes: ['social'],
  currentRound: 0,
  totalRounds: 20,
  skips: 0,
  usedChallenges: new Set(),
  sipMultiplier: 1,
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);

  const addPlayer = (name: string) => {
    if (!name.trim()) return;
    setState(prev => ({
      ...prev,
      players: [
        ...prev.players,
        {
          id: Date.now(),
          name: name.trim(),
          color: PlayerColors[prev.players.length % PlayerColors.length],
          rank: PlayerRanks[prev.players.length % PlayerRanks.length],
        },
      ],
    }));
  };

  const removePlayer = (id: number) => {
    setState(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== id),
    }));
  };

  const updatePlayerPhoto = (id: number, uri: string) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, photo: uri } : p),
    }));
  };

  const toggleMode = (mode: string) => {
    setState(prev => {
      const already = prev.selectedModes.includes(mode);
      // Must keep at least one mode selected
      if (already && prev.selectedModes.length === 1) return prev;
      return {
        ...prev,
        selectedModes: already
          ? prev.selectedModes.filter(m => m !== mode)
          : [...prev.selectedModes, mode],
      };
    });
  };

  const setSipMultiplier = (multiplier: 1 | 2 | 3 | 4) => {
    setState(prev => ({ ...prev, sipMultiplier: multiplier }));
  };

  const startGame = () => {
    setState(prev => ({
      ...prev,
      currentRound: 1,
      skips: 0,
      usedChallenges: new Set(),
    }));
  };

  const nextRound = () => {
    setState(prev => ({ ...prev, currentRound: prev.currentRound + 1 }));
  };

  const skipRound = () => {
    setState(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      skips: prev.skips + 1,
    }));
  };

  const resetGame = () => {
    setState(prev => ({
      ...defaultState,
      players: prev.players,
      selectedModes: prev.selectedModes,
      sipMultiplier: prev.sipMultiplier,
    }));
  };

  return (
    <GameContext.Provider value={{
      state,
      addPlayer,
      removePlayer,
      updatePlayerPhoto,
      toggleMode,
      setSipMultiplier,
      startGame,
      nextRound,
      skipRound,
      resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}