// src/utils/cardTitles.ts
// Every card shows a title. Custom cards store one (card.title); legacy
// custom cards and built-in Sip Happens cards don't, so this module derives
// a clean, deterministic title from the card text: tokens become their
// friendly labels, and the first few words are title-cased.
//
// If you later hand-curate titles in gameData.ts (optional `title` field on
// a challenge), getChallengeTitle will use them automatically.

import { Challenge } from '../data/gameData';
import { TOKEN_META } from '../components/TokenText';

const SMALL_WORDS = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'or', 'and', 'for', 'with']);
const MAX_TITLE_WORDS = 5;

/** "{player1} does an impression of {player2}" → "Player 1 Does an Impression…" */
export function titleFromText(text: string): string {
  const withLabels = text.replace(/\{(\w+)\}/g, (_, key: string) =>
    TOKEN_META[key]?.label ?? key.replace(/_/g, ' '));

  const words = withLabels
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const slice = words.slice(0, MAX_TITLE_WORDS);
  const titled = slice.map((w, i) => {
    const lower = w.toLowerCase();
    if (i > 0 && SMALL_WORDS.has(lower)) return lower;
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  return titled.join(' ') + (words.length > MAX_TITLE_WORDS ? '…' : '');
}

/** Title for a built-in challenge: stored title if present, else derived. */
export function getChallengeTitle(challenge: Challenge): string {
  const stored = (challenge as { title?: string }).title;
  return stored && stored.trim() ? stored : titleFromText(challenge.text);
}

/** Title for a custom card shape ({ title?, text }). */
export function getCardTitle(card: { title?: string; text: string }): string {
  return card.title && card.title.trim() ? card.title : titleFromText(card.text);
}
