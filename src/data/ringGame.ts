// src/data/ringGame.ts
// Ring of Fire state machine, as PURE FUNCTIONS — same shape as dealerGame.ts
// and traitorsGame.ts so tools/ring-smoke.ts can play whole games with an
// injected deck, no React required.
//
// The state this mode exists to remember:
//   roles      Thumb Master (4), Question Master (Q) and Mate (8) each persist
//              "until the next one is drawn". Drawing that rank transfers it.
//   kingsDrawn The last King is the climax; the 4th drawer downs the glass.
//   houseRules Every Jack adds a rule the table has to keep obeying.

import { Card, DECK_SIZE, shuffledDeck } from './playingCards';
import { KINGS_IN_DECK, RingRule, suggestionFor } from './ringData';
import { CLASSIC_SET, RingRuleSet, resolveRule } from './ringSets';

export interface RingPlayerRef {
  id: number;
  name: string;
}

export type RingPhase = 'draw' | 'card' | 'over';

export interface RingRoles {
  thumbMasterId: number | null;
  questionMasterId: number | null;
  /** Set by an 8. Both players drink together until the next 8. */
  mate: { aId: number; bId: number } | null;
}

export interface HouseRule {
  id: string;
  text: string;
  byPlayerId: number;
}

export interface RingConfig {
  players: RingPlayerRef[];
  /** true (classic): the game ends on the 4th King. false: play all 52. */
  endOnLastKing: boolean;
  /**
   * Which rule set is in play. Behaviour comes from each entry's MECHANIC, not
   * from the rank number, so a set may move `pour` off the King. Defaults to
   * the classic set.
   */
  ruleSet?: RingRuleSet;
}

export interface RingState {
  deck: Card[];
  drawn: Card[];
  turnIndex: number;
  phase: RingPhase;
  /** The card on the table. Null while phase is 'draw'. */
  current: Card | null;
  currentRule: RingRule | null;
  /** Category or rhyme starter offered for this card. */
  suggestion: string | null;
  roles: RingRoles;
  houseRules: HouseRule[];
  kingsDrawn: number;
  /** Who must down the middle glass — set when the last King lands. */
  finalKingPlayerId: number | null;
  /** An 8 is on the table and no mate has been picked yet. */
  awaitingMate: boolean;
}

const emptyRoles = (): RingRoles => ({
  thumbMasterId: null,
  questionMasterId: null,
  mate: null,
});

export function createGame(cfg: RingConfig, deck: Card[] = shuffledDeck()): RingState {
  return {
    deck,
    drawn: [],
    turnIndex: 0,
    phase: deck.length > 0 && cfg.players.length > 0 ? 'draw' : 'over',
    current: null,
    currentRule: null,
    suggestion: null,
    roles: emptyRoles(),
    houseRules: [],
    kingsDrawn: 0,
    finalKingPlayerId: null,
    awaitingMate: false,
  };
}

export function currentPlayer(s: RingState, cfg: RingConfig): RingPlayerRef | null {
  const n = cfg.players.length;
  if (n === 0) return null;
  return cfg.players[s.turnIndex % n];
}

export function playerById(cfg: RingConfig, id: number | null): RingPlayerRef | null {
  if (id == null) return null;
  return cfg.players.find(p => p.id === id) ?? null;
}

export function isOver(s: RingState): boolean {
  return s.phase === 'over';
}

export function cardsPlayed(s: RingState): number {
  return s.drawn.length;
}

export function deckRemaining(s: RingState): number {
  return s.deck.length;
}

/** Kings still to come. */
export function kingsLeft(s: RingState): number {
  return Math.max(0, KINGS_IN_DECK - s.kingsDrawn);
}

/** Turn the top card face up and apply its lasting effects. */
export function drawCard(s: RingState, cfg: RingConfig): RingState {
  if (s.phase !== 'draw') return s;
  const [card, ...rest] = s.deck;
  if (!card) return { ...s, phase: 'over' };

  const player = currentPlayer(s, cfg);
  if (!player) return s;

  const rule = resolveRule(cfg.ruleSet ?? CLASSIC_SET, card.rank);
  const roles: RingRoles = { ...s.roles };
  let kingsDrawn = s.kingsDrawn;
  let finalKingPlayerId = s.finalKingPlayerId;
  let awaitingMate = false;

  if (rule.role === 'thumbMaster') roles.thumbMasterId = player.id;
  if (rule.role === 'questionMaster') roles.questionMasterId = player.id;
  if (rule.role === 'mate') {
    // The old pairing ends the moment a new 8 appears, even before the new
    // mate is chosen — otherwise the previous pair keeps drinking together.
    roles.mate = null;
    awaitingMate = cfg.players.length > 1;
  }
  if (rule.pours) {
    kingsDrawn += 1;
    if (kingsDrawn >= KINGS_IN_DECK) finalKingPlayerId = player.id;
  }

  return {
    ...s,
    deck: rest,
    drawn: [...s.drawn, card],
    phase: 'card',
    current: card,
    currentRule: rule,
    suggestion: suggestionFor(rule),
    roles,
    kingsDrawn,
    finalKingPlayerId,
    awaitingMate,
  };
}

/** Resolve the 8: pair the drawer with their chosen mate. */
export function pickMate(s: RingState, cfg: RingConfig, mateId: number): RingState {
  if (!s.awaitingMate) return s;
  const player = currentPlayer(s, cfg);
  if (!player || mateId === player.id) return s;
  if (!cfg.players.some(p => p.id === mateId)) return s;
  return {
    ...s,
    roles: { ...s.roles, mate: { aId: player.id, bId: mateId } },
    awaitingMate: false,
  };
}

/** Record a Jack's rule so the table can be reminded of it. */
export function addHouseRule(s: RingState, cfg: RingConfig, text: string): RingState {
  const trimmed = text.trim();
  if (s.phase !== 'card' || trimmed.length === 0) return s;
  const player = currentPlayer(s, cfg);
  if (!player) return s;
  return {
    ...s,
    houseRules: [
      ...s.houseRules,
      { id: `rule-${s.drawn.length}-${player.id}`, text: trimmed, byPlayerId: player.id },
    ],
  };
}

export function removeHouseRule(s: RingState, id: string): RingState {
  return { ...s, houseRules: s.houseRules.filter(r => r.id !== id) };
}

/** True when this card should be the last of the game. */
export function endsGame(s: RingState, cfg: RingConfig): boolean {
  if (s.phase !== 'card') return false;
  if (cfg.endOnLastKing && s.kingsDrawn >= KINGS_IN_DECK) return true;
  return s.deck.length === 0;
}

/** Pass the deck on. Ends the game if this was the last card. */
export function nextTurn(s: RingState, cfg: RingConfig): RingState {
  if (s.phase !== 'card') return s;
  if (endsGame(s, cfg)) return { ...s, phase: 'over' };

  const n = Math.max(1, cfg.players.length);
  return {
    ...s,
    turnIndex: (s.turnIndex + 1) % n,
    phase: 'draw',
    current: null,
    currentRule: null,
    suggestion: null,
    awaitingMate: false,
  };
}

export function endGame(s: RingState): RingState {
  return { ...s, phase: 'over' };
}

export interface RingSummary {
  cardsPlayed: number;
  deckSize: number;
  kingsDrawn: number;
  finalKingPlayerId: number | null;
  houseRules: HouseRule[];
  roles: RingRoles;
}

export function summarise(s: RingState): RingSummary {
  return {
    cardsPlayed: s.drawn.length,
    deckSize: DECK_SIZE,
    kingsDrawn: s.kingsDrawn,
    finalKingPlayerId: s.finalKingPlayerId,
    houseRules: s.houseRules,
    roles: s.roles,
  };
}
