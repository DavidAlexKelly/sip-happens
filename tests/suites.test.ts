// SipHappens/tests/suites.test.ts
// Runs every game-logic suite under vitest, one `it()` per check.
//
// This file is what puts the suites in CI. The repo-root `npm test` runs vitest
// across the whole repository, and every module these suites touch is
// React-Native-free by design — which is exactly why the pure/impure split in
// packs.ts, ringSets.ts and the *Game.ts state machines was worth enforcing.
//
// Importing a suite module executes its checks and registers the results; the
// loops below then turn each one into a named test.

import { describe, expect, it } from 'vitest';

import '../tools/packs-smoke';
import '../tools/scopes-smoke';
import '../tools/ring-smoke';
import '../tools/dealer-smoke';
import '../tools/trivia-smoke';
import '../tools/traitors-smoke';

import { allSuites, resultsFor } from './harness';

/** Minimum check counts, so a suite silently emptying itself fails loudly. */
const EXPECTED_MINIMUMS: Record<string, number> = {
  packs: 60,
  scopes: 80,
  ring: 125,
  dealer: 90,
  trivia: 30,
  traitors: 60,
};

describe('game logic suites', () => {
  it('every expected suite registered', () => {
    const names = allSuites().map(([name]) => name).sort();
    expect(names).toEqual(Object.keys(EXPECTED_MINIMUMS).sort());
  });

  for (const [name, minimum] of Object.entries(EXPECTED_MINIMUMS)) {
    describe(name, () => {
      const results = resultsFor(name);

      it(`has at least ${minimum} checks`, () => {
        expect(results.length).toBeGreaterThanOrEqual(minimum);
      });

      for (const result of results) {
        it(result.name, () => {
          expect(result.ok, result.detail || result.name).toBe(true);
        });
      }
    });
  }
});
