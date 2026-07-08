// src/components/GameContext.tsx
// Refactored: useReducer (predictable transitions), totalRounds computed once at
// startGame (single source of truth), collision-free player ids/colors, and
// lightweight persistence so the player list + settings survive an app restart.
// Public API is unchanged — no screen edits required for this file.

import React, {
  createContext, useContext, useEffect, useReducer, useRef, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerColors, PlayerRanks } from '../styles/theme';

export interface Player {
  id: number;
  name: string;
  color: string;
  rank: string;
  photo?: string;
}

export interface GameState {
  players: Player[];
  selectedModes: string[];
  currentRound: number;
  totalRounds: number;
  skips: number;
  /** Additive sip bonus: 0 = standard, 1 = +1, 2 = +2, 3 = +3 */
  sipBonus: 0 | 1 | 2 | 3;
}

// 20 rounds for 2 players, +6 per additional player.
// Lives here (not in GameScreen) so penalties, progress bars and end
// conditions all read the same number.
export function computeTotalRounds(playerCount: number): number {
  return 20 + Math.max(0, playerCount - 2) * 6;
}

type Action =
  | { type: 'ADD_PLAYER'; name: string }
  | { type: 'REMOVE_PLAYER'; id: number }
  | { type: 'UPDATE_PHOTO'; id: number; uri: string }
  | { type: 'TOGGLE_MODE'; mode: string }
  | { type: 'SET_SELECTED_MODES'; modes: string[] }
  | { type: 'SET_SIP_BONUS'; bonus: 0 | 1 | 2 | 3 }
  | { type: 'START_GAME' }
  | { type: 'NEXT_ROUND' }
  | { type: 'SKIP_ROUND' }
  | { type: 'RESET_GAME' }
  | { type: 'HYDRATE'; players: Player[]; sipBonus: 0 | 1 | 2 | 3 };

const defaultState: GameState = {
  players: [],
  selectedModes: ['getting_started'],
  currentRound: 0,
  totalRounds: 20,
  skips: 0,
  sipBonus: 0,
};

// Monotonic id generator — immune to two adds landing on the same millisecond.
let lastId = Date.now();
function nextPlayerId(): number {
  lastId = Math.max(Date.now(), lastId + 1);
  return lastId;
}

// Pick the first palette color not already in use, so removing a player
// mid-setup never produces two players with the same color.
function pickColor(players: Player[]): string {
  const used = new Set(players.map(p => p.color));
  return PlayerColors.find(c => !used.has(c))
    ?? PlayerColors[players.length % PlayerColors.length];
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ADD_PLAYER': {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        players: [
          ...state.players,
          {
            id: nextPlayerId(),
            name,
            color: pickColor(state.players),
            rank: PlayerRanks[state.players.length % PlayerRanks.length],
          },
        ],
      };
    }
    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.id) };

    case 'UPDATE_PHOTO':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.id ? { ...p, photo: action.uri } : p),
      };

    case 'TOGGLE_MODE': {
      const already = state.selectedModes.includes(action.mode);
      if (already && state.selectedModes.length === 1) return state; // keep ≥1 deck
      return {
        ...state,
        selectedModes: already
          ? state.selectedModes.filter(m => m !== action.mode)
          : [...state.selectedModes, action.mode],
      };
    }
    case 'SET_SELECTED_MODES':
      return action.modes.length === 0
        ? state
        : { ...state, selectedModes: action.modes };

    case 'SET_SIP_BONUS':
      return { ...state, sipBonus: action.bonus };

    case 'START_GAME':
      return {
        ...state,
        currentRound: 1,
        skips: 0,
        totalRounds: computeTotalRounds(state.players.length),
      };

    case 'NEXT_ROUND':
      return { ...state, currentRound: state.currentRound + 1 };

    case 'SKIP_ROUND':
      return { ...state, currentRound: state.currentRound + 1, skips: state.skips + 1 };

    case 'RESET_GAME':
      return {
        ...defaultState,
        players: state.players,
        selectedModes: state.selectedModes,
        sipBonus: state.sipBonus,
      };

    case 'HYDRATE':
      // Only hydrate outside an active game and if nothing was typed yet.
      if (state.currentRound > 0 || state.players.length > 0) return state;
      return { ...state, players: action.players, sipBonus: action.sipBonus };

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  addPlayer: (name: string) => void;
  removePlayer: (id: number) => void;
  updatePlayerPhoto: (id: number, uri: string) => void;
  toggleMode: (mode: string) => void;
  setSelectedModes: (modes: string[]) => void;
  setSipBonus: (bonus: 0 | 1 | 2 | 3) => void;
  startGame: () => void;
  nextRound: () => void;
  skipRound: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

const PERSIST_KEY = '@siphappens_setup_v1';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const hydratedRef = useRef(false);

  // Restore last-used crew + sip bonus (huge quality-of-life for repeat groups).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PERSIST_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { players?: Player[]; sipBonus?: 0 | 1 | 2 | 3 };
          dispatch({
            type: 'HYDRATE',
            players: Array.isArray(saved.players) ? saved.players : [],
            sipBonus: saved.sipBonus ?? 0,
          });
        }
      } catch { /* corrupt or missing — start fresh */ }
      hydratedRef.current = true;
    })();
  }, []);

  // Persist setup whenever it changes (post-hydration only).
  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ players: state.players, sipBonus: state.sipBonus }),
    ).catch(() => {});
  }, [state.players, state.sipBonus]);

  const api: GameContextType = {
    state,
    addPlayer:        (name) => dispatch({ type: 'ADD_PLAYER', name }),
    removePlayer:     (id)   => dispatch({ type: 'REMOVE_PLAYER', id }),
    updatePlayerPhoto:(id, uri) => dispatch({ type: 'UPDATE_PHOTO', id, uri }),
    toggleMode:       (mode) => dispatch({ type: 'TOGGLE_MODE', mode }),
    setSelectedModes: (modes) => dispatch({ type: 'SET_SELECTED_MODES', modes }),
    setSipBonus:      (bonus) => dispatch({ type: 'SET_SIP_BONUS', bonus }),
    startGame:        () => dispatch({ type: 'START_GAME' }),
    nextRound:        () => dispatch({ type: 'NEXT_ROUND' }),
    skipRound:        () => dispatch({ type: 'SKIP_ROUND' }),
    resetGame:        () => dispatch({ type: 'RESET_GAME' }),
  };

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}