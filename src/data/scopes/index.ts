// src/data/scopes/index.ts
// Registry of content scopes.
//
// Ring of Fire is deliberately absent. Its "content" is a rule set — exactly
// one entry per rank, not a mixable list of items — so forcing it into the
// pack model would be wrong. It gets its own editor; see src/data/ringSets.ts.

import { PackScope } from '../packs';
import { ScopeAdapter } from './types';
import { truthOrDareAdapter } from './truthOrDare';
import { triviaAdapter } from './trivia';
import { traitorsAdapter } from './traitors';

export * from './types';
export { CARD_CATEGORIES, playMode } from './categories';
export type { CardCategory } from './categories';
export type { TruthOrDarePayload } from './truthOrDare';
export type { TriviaPayload } from './trivia';
export type { TraitorsPayload } from './traitors';

/** Scopes that use the shared pack/item library. */
export type LibraryScope = 'truthOrDare' | 'trivia' | 'traitors';

const ADAPTERS: Record<LibraryScope, ScopeAdapter> = {
  truthOrDare: truthOrDareAdapter,
  trivia: triviaAdapter,
  traitors: traitorsAdapter,
};

export const LIBRARY_SCOPES: LibraryScope[] = ['truthOrDare', 'trivia', 'traitors'];

export function isLibraryScope(scope: PackScope): scope is LibraryScope {
  return (LIBRARY_SCOPES as PackScope[]).includes(scope);
}

export function adapterFor(scope: LibraryScope): ScopeAdapter {
  return ADAPTERS[scope];
}
