// SipHappens/tests/harness.ts
// Collects check results so the same suites can run two ways:
//
//   • under vitest in CI, one `it()` per check with its real name
//   • by hand via `node tools/run-smoke.js` for a readable console report
//
// Previously each suite printed to the console and called process.exit, which
// meant nothing could run them automatically — 477 checks that protected
// nothing. Registering results instead fixes that without rewriting them.

export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

export type Check = (name: string, cond: boolean, detail?: string) => void;

const suites = new Map<string, CheckResult[]>();

/**
 * Start a suite and return its `check` function. Importing a suite module runs
 * its checks as a side effect and registers them under this name.
 */
export function suite(name: string): Check {
  const results: CheckResult[] = [];
  suites.set(name, results);
  return (checkName: string, cond: boolean, detail = '') => {
    results.push({ name: checkName, ok: !!cond, detail });
  };
}

export function resultsFor(name: string): CheckResult[] {
  return suites.get(name) ?? [];
}

export function allSuites(): Array<[string, CheckResult[]]> {
  return [...suites.entries()];
}
