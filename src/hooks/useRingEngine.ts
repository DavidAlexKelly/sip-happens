// src/hooks/useRingEngine.ts
// Thin React wrapper around the Ring of Fire state machine. Every rule lives
// in src/data/ringGame.ts as a pure function, so tools/ring-smoke.ts can test
// it without a device.

import { useCallback, useRef, useState } from 'react';
import {
  RingConfig, RingState, RingSummary,
  addHouseRule, createGame, currentPlayer, deckRemaining, drawCard, endGame,
  endsGame, isOver, kingsLeft, nextTurn, pickMate, playerById, removeHouseRule,
  summarise,
} from '../data/ringGame';

/**
 * Snapshot for the results screen. RingGameScreen navigates with `replace`,
 * so the hook is gone by the time the summary renders — same approach as the
 * other three modes.
 */
let finalSummary: RingSummary | null = null;

export function readRingSummary(): RingSummary | null {
  return finalSummary;
}

export function useRingEngine(cfg: RingConfig) {
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const [state, setState] = useState<RingState>(() => createGame(cfg));

  // Read through a ref so finishGame() never captures a stale state.
  const stateRef = useRef(state);
  stateRef.current = state;

  const draw = useCallback(() => {
    setState(s => drawCard(s, cfgRef.current));
  }, []);

  const advance = useCallback(() => {
    setState(s => nextTurn(s, cfgRef.current));
  }, []);

  const choose = useCallback((mateId: number) => {
    setState(s => pickMate(s, cfgRef.current, mateId));
  }, []);

  const recordRule = useCallback((text: string) => {
    setState(s => addHouseRule(s, cfgRef.current, text));
  }, []);

  const dropRule = useCallback((id: string) => {
    setState(s => removeHouseRule(s, id));
  }, []);

  const quit = useCallback(() => {
    setState(s => endGame(s));
  }, []);

  /** Call immediately before navigating to the results screen. */
  const finishGame = useCallback(() => {
    finalSummary = summarise(stateRef.current);
  }, []);

  const c = cfgRef.current;

  return {
    state,
    phase: state.phase,
    card: state.current,
    rule: state.currentRule,
    suggestion: state.suggestion,
    roles: state.roles,
    houseRules: state.houseRules,
    drawnCards: state.drawn,
    kingsDrawn: state.kingsDrawn,
    kingsLeft: kingsLeft(state),
    deckRemaining: deckRemaining(state),
    awaitingMate: state.awaitingMate,
    isOver: isOver(state),
    isFinalCard: endsGame(state, c),
    currentPlayer: currentPlayer(state, c),
    finalKingPlayer: playerById(c, state.finalKingPlayerId),
    thumbMaster: playerById(c, state.roles.thumbMasterId),
    questionMaster: playerById(c, state.roles.questionMasterId),
    mateA: playerById(c, state.roles.mate?.aId ?? null),
    mateB: playerById(c, state.roles.mate?.bId ?? null),
    draw,
    advance,
    choose,
    recordRule,
    dropRule,
    quit,
    finishGame,
  };
}
