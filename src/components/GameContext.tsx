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
  /** Additive sip bonus: 0 = standard, 1 = +1, 2 = +2, 3 = +3 */
  sipBonus: 0 | 1 | 2 | 3;
}

interface GameContextType {
  state: GameState;
  addPlayer: (name: string) => void;
  removePlayer: (id: number) => void;
  updatePlayerPhoto: (id: number, uri: string) => void;
  toggleMode: (mode: string) => void;
  setSipBonus: (bonus: 0 | 1 | 2 | 3) => void;
  startGame: () => void;
  nextRound: () => void;
  skipRound: () => void;
  resetGame: () => void;
}

const defaultState: GameState = {
  players: [],
  selectedModes: ['getting_started'],
  currentRound: 0,
  totalRounds: 20,
  skips: 0,
  usedChallenges: new Set(),
  sipBonus: 0,
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
      if (already && prev.selectedModes.length === 1) return prev;
      return {
        ...prev,
        selectedModes: already
          ? prev.selectedModes.filter(m => m !== mode)
          : [...prev.selectedModes, mode],
      };
    });
  };

  const setSipBonus = (bonus: 0 | 1 | 2 | 3) => {
    setState(prev => ({ ...prev, sipBonus: bonus }));
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
      sipBonus: prev.sipBonus,
    }));
  };

  return (
    <GameContext.Provider value={{
      state,
      addPlayer,
      removePlayer,
      updatePlayerPhoto,
      toggleMode,
      setSipBonus,
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