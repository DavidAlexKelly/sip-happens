// tools/packs-smoke.ts
// Checks for the shared content library. The pure half of src/data/packs.ts
// has no React Native dependency, so all of this runs here.
//
// The migration checks are the important ones: losing somebody's saved decks
// is the only genuinely destructive risk in the packs work.
//
//   npx tsc --outDir .packs --rootDir . --module commonjs --target ES2020 \
//     --moduleResolution node --resolveJsonModule --strict --skipLibCheck \
//     --esModuleInterop tools/packs-smoke.ts
//   node .packs/tools/packs-smoke.js

import {
  CustomItem, LegacyCard, LegacyDeck, Pack, TruthOrDarePayload,
  addToPack, buildPool, builtinIdOf, builtinRef, collectRefs, findPack,
  isBuiltinRef, itemsInScope, livePackSize, migrateLegacy, newId, packsInScope,
  removeFromPack, removeItem, removePack, splitSelection, toggleInPack,
  upsertItem, upsertPack,
} from '../src/data/packs';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name} ${detail}`); failures++; }
}

const item = (id: string, text: string): CustomItem<TruthOrDarePayload> => ({
  id, scope: 'truthOrDare', createdAt: 1, payload: { text, action: 'Do it' },
});

const pack = (id: string, itemIds: string[], scope: Pack['scope'] = 'truthOrDare'): Pack => ({
  id, scope, name: id, icon: 'star', color: '#fff', itemIds, createdAt: 1,
});

console.log('\n1. Built-in references');
check('builtinRef prefixes', builtinRef('drink-3') === 'builtin:drink-3');
check('isBuiltinRef detects them', isBuiltinRef('builtin:drink-3'));
check('a custom id is not a builtin ref', !isBuiltinRef('truthOrDare-item-1'));
check('builtinIdOf strips the prefix', builtinIdOf('builtin:drink-3') === 'drink-3');
check('builtinIdOf returns null for custom', builtinIdOf('abc') === null);
check('round trip', builtinIdOf(builtinRef('x-1')) === 'x-1');

console.log('\n2. Ids');
{
  const a = newId('trivia', 'item');
  const b = newId('trivia', 'item');
  check('ids are unique even back to back', a !== b, `${a} vs ${b}`);
  check('ids carry their scope', a.startsWith('trivia-item-'));
  check('packs and items are distinguishable',
    newId('ring', 'pack').includes('-pack-'));
  check('two scopes cannot collide',
    !newId('trivia', 'item').startsWith('ring-'));
}

console.log('\n3. Scoping');
{
  const packs = [pack('p1', []), pack('p2', [], 'trivia')];
  const items = [item('i1', 'a'), { ...item('i2', 'b'), scope: 'trivia' as const }];
  check('packsInScope filters', packsInScope(packs, 'truthOrDare').length === 1);
  check('itemsInScope filters', itemsInScope(items, 'trivia').length === 1);
  check('an empty scope returns nothing', packsInScope(packs, 'ring').length === 0);
}

console.log('\n4. Pack CRUD');
{
  let packs = [pack('p1', ['i1'])];
  check('findPack finds', findPack(packs, 'p1')?.id === 'p1');
  check('findPack misses cleanly', findPack(packs, 'nope') === undefined);

  packs = upsertPack(packs, pack('p2', []));
  check('upsert adds', packs.length === 2);
  packs = upsertPack(packs, { ...pack('p1', ['i1', 'i2']), name: 'renamed' });
  check('upsert replaces rather than duplicating', packs.length === 2);
  check('  → and applies the change',
    findPack(packs, 'p1')?.name === 'renamed');

  packs = removePack(packs, 'p2');
  check('removePack removes', packs.length === 1 && !findPack(packs, 'p2'));
}

console.log('\n5. Pack membership');
{
  let p = pack('p1', []);
  p = addToPack(p, 'i1');
  check('add appends', p.itemIds.length === 1);
  p = addToPack(p, 'i1');
  check('add ignores duplicates', p.itemIds.length === 1);
  p = addToPack(p, builtinRef('drink-1'));
  check('custom and builtin coexist', p.itemIds.length === 2);
  check('  → order is preserved',
    p.itemIds[0] === 'i1' && p.itemIds[1] === 'builtin:drink-1');

  p = toggleInPack(p, 'i1');
  check('toggle removes what is present', !p.itemIds.includes('i1'));
  p = toggleInPack(p, 'i1');
  check('toggle re-adds what is absent', p.itemIds.includes('i1'));
  p = removeFromPack(p, 'missing');
  check('removing an absent ref is harmless', p.itemIds.length === 2);
}

console.log('\n6. Deleting an item cleans up references');
{
  const items = [item('i1', 'a'), item('i2', 'b')];
  const packs = [pack('p1', ['i1', 'i2']), pack('p2', ['i1'])];
  const after = removeItem(items, packs, 'i1');
  check('item is gone', after.items.length === 1);
  check('reference removed from every pack',
    after.packs.every(p => !p.itemIds.includes('i1')));
  check('  → other references untouched',
    findPack(after.packs, 'p1')!.itemIds.includes('i2'));
  check('a pack that only held it is now empty',
    findPack(after.packs, 'p2')!.itemIds.length === 0);
  check('deleting something absent is a no-op',
    removeItem(items, packs, 'zzz').items.length === 2);
}

console.log('\n7. Reference collection and pooling');
{
  const packs = [
    pack('p1', ['i1', builtinRef('b1')]),
    pack('p2', ['i2', 'i1']),           // i1 appears twice across packs
  ];
  const items = [item('i1', 'one'), item('i2', 'two')];

  const refs = collectRefs(packs, ['p1', 'p2']);
  check('refs are de-duplicated across packs', refs.length === 3, refs.join(','));
  check('  → first-seen order kept',
    refs.join(',') === 'i1,builtin:b1,i2');
  check('unknown pack ids are skipped',
    collectRefs(packs, ['p1', 'ghost']).length === 2);
  check('no selection means no refs', collectRefs(packs, []).length === 0);

  const pool = buildPool(packs, ['p1', 'p2'], items, {
    builtin: id => `B:${id}`,
    custom: it => `C:${it.payload.text}`,
  });
  check('pool resolves both kinds',
    pool.join(',') === 'C:one,B:b1,C:two', pool.join(','));

  // A pack referencing a deleted item must not produce a hole.
  const holed = buildPool([pack('p3', ['i1', 'gone', 'i2'])], ['p3'], items, {
    builtin: id => `B:${id}`,
    custom: it => `C:${it.payload.text}`,
  });
  check('a dangling reference is skipped, not crashed',
    holed.join(',') === 'C:one,C:two', holed.join(','));

  // A resolver may reject an item (e.g. it fails that mode's validation).
  const filtered = buildPool(packs, ['p1'], items, {
    builtin: () => undefined,
    custom: it => (it.id === 'i1' ? undefined : `C:${it.payload.text}`),
  });
  check('resolvers can reject items', filtered.length === 0);

  check('livePackSize counts builtins and live items',
    livePackSize(pack('p4', ['i1', builtinRef('b9'), 'deleted']), items) === 2);
}

console.log('\n8. splitSelection');
{
  const s = splitSelection(['getting_started', 'p1', 'spicy'], ['getting_started', 'spicy']);
  check('built-ins separated', s.builtIn.join(',') === 'getting_started,spicy');
  check('pack ids separated', s.packIds.join(',') === 'p1');
  check('empty in, empty out',
    splitSelection([], ['a']).builtIn.length === 0);
}

console.log('\n9. Legacy migration — the destructive risk');
{
  const cards: LegacyCard[] = [
    { id: 'c1', text: 'Old card one', action: 'Drink', createdAt: 111, title: 'One', category: 'dare' },
    { id: 'c2', text: 'Old card two', action: 'Sip', createdAt: 222 },
  ];
  const decks: LegacyDeck[] = [
    { id: 'd1', name: 'My Deck', icon: 'beer', color: '#FFCC26', cardIds: ['c1', 'builtin:drink-4', 'c2'], createdAt: 333 },
    { id: 'd2', name: 'Empty', icon: 'star', color: '#FF4D8D', cardIds: [], createdAt: 444 },
  ];

  const { items, packs } = migrateLegacy(cards, decks);

  check('every card becomes an item', items.length === 2);
  check('every deck becomes a pack', packs.length === 2);
  check('item ids are PRESERVED', items.map(i => i.id).join(',') === 'c1,c2');
  check('pack ids are PRESERVED', packs.map(p => p.id).join(',') === 'd1,d2');
  check('everything lands in the truthOrDare scope',
    items.every(i => i.scope === 'truthOrDare') && packs.every(p => p.scope === 'truthOrDare'));

  check('card text survives', items[0].payload.text === 'Old card one');
  check('card action survives', items[0].payload.action === 'Drink');
  check('optional title survives', items[0].payload.title === 'One');
  check('optional category survives', items[0].payload.category === 'dare');
  check('a legacy card with no title/category is fine',
    items[1].payload.title === undefined && items[1].payload.category === undefined);
  check('createdAt survives', items[0].createdAt === 111 && packs[0].createdAt === 333);

  check('deck name/icon/colour survive',
    packs[0].name === 'My Deck' && packs[0].icon === 'beer' && packs[0].color === '#FFCC26');
  check('deck contents survive IN ORDER',
    packs[0].itemIds.join(',') === 'c1,builtin:drink-4,c2', packs[0].itemIds.join(','));
  check('builtin refs survive the migration untouched',
    packs[0].itemIds.includes('builtin:drink-4'));
  check('an empty deck stays empty but is kept', packs[1].itemIds.length === 0);

  // The migrated data must actually be playable.
  const pool = buildPool(packs, ['d1'], items, {
    builtin: id => `B:${id}`,
    custom: it => `C:${it.payload.text}`,
  });
  check('migrated packs resolve into a pool',
    pool.join(',') === 'C:Old card one,B:drink-4,C:Old card two', pool.join(','));
  check('every migrated reference still resolves',
    livePackSize(packs[0], items) === 3);

  // Degenerate inputs.
  check('empty legacy data yields empty output',
    migrateLegacy([], []).items.length === 0 && migrateLegacy([], []).packs.length === 0);
  const orphan = migrateLegacy([], [{ ...decks[0], cardIds: ['ghost'] }]);
  check('a deck referencing a missing card still migrates',
    orphan.packs[0].itemIds.join(',') === 'ghost');
  check('  → and simply resolves to nothing',
    buildPool(orphan.packs, ['d1'], [], { builtin: () => 'B', custom: () => 'C' }).length === 0);
  const noTimestamps = migrateLegacy(
    [{ id: 'x', text: 't', action: 'a' }],
    [{ id: 'y', name: 'n', icon: 'i', color: 'c', cardIds: [] }],
  );
  check('missing createdAt defaults instead of becoming NaN',
    noTimestamps.items[0].createdAt === 0 && noTimestamps.packs[0].createdAt === 0);
}

console.log('\n10. Item CRUD');
{
  let items = [item('i1', 'a')];
  items = upsertItem(items, item('i2', 'b'));
  check('upsert adds', items.length === 2);
  items = upsertItem(items, item('i1', 'edited'));
  check('upsert replaces', items.length === 2);
  check('  → with the new payload',
    items.find(i => i.id === 'i1')!.payload.text === 'edited');
}

console.log(failures === 0 ? '\nALL CHECKS PASSED\n' : `\n${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
