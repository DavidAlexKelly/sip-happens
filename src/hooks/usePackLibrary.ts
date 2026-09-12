// src/hooks/usePackLibrary.ts
// Loads and mutates one scope's content library.
//
// All the decision-making lives in the pure helpers in data/packs.ts and the
// scope adapters; this only wires them to storage and React state. Reloads on
// focus so returning from the pack editor shows the change.

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  CustomItem, Pack,
  newId, removeItem as removeItemPure, upsertItem, upsertPack, removePack,
} from '../data/packs';
import { loadItems, loadPacks, saveItems, savePacks } from '../data/packStorage';
import { LibraryScope, adapterFor } from '../data/scopes';
import { FormValues } from '../data/scopes/types';

export function usePackLibrary(scope: LibraryScope) {
  const adapter = adapterFor(scope);
  const [items, setItems] = useState<CustomItem[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [i, p] = await Promise.all([loadItems(scope), loadPacks(scope)]);
    setItems(i);
    setPacks(p);
    setLoading(false);
  }, [scope]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [i, p] = await Promise.all([loadItems(scope), loadPacks(scope)]);
        if (cancelled) return;
        setItems(i);
        setPacks(p);
        setLoading(false);
      })();
      return () => { cancelled = true; };
    }, [scope]),
  );

  const persistItems = useCallback(async (next: CustomItem[]) => {
    setItems(next);
    await saveItems(scope, next);
  }, [scope]);

  const persistPacks = useCallback(async (next: Pack[]) => {
    setPacks(next);
    await savePacks(scope, next);
  }, [scope]);

  /**
   * Validate and store an item. Returns the problem string when rejected, so
   * the caller can show it without duplicating the rules.
   */
  const saveItem = useCallback(async (
    form: FormValues,
    existingId?: string,
  ): Promise<string | null> => {
    const problem = adapter.validate(form);
    if (problem) return problem;

    const payload = adapter.payloadFromForm(form);
    const existing = existingId ? items.find(i => i.id === existingId) : undefined;
    const item: CustomItem = {
      id: existing?.id ?? newId(scope, 'item'),
      scope,
      createdAt: existing?.createdAt ?? Date.now(),
      payload,
    };
    await persistItems(upsertItem(items, item));
    return null;
  }, [adapter, items, persistItems, scope]);

  /** Deletes the item AND every reference to it, so no pack is left short. */
  const deleteItem = useCallback(async (id: string) => {
    const next = removeItemPure(items, packs, id);
    await Promise.all([persistItems(next.items), persistPacks(next.packs)]);
  }, [items, packs, persistItems, persistPacks]);

  const createPack = useCallback(async (name: string): Promise<Pack> => {
    const pack: Pack = {
      id: newId(scope, 'pack'),
      scope,
      name: name.trim() || `New ${adapter.packNoun}`,
      icon: adapter.defaultPackIcon,
      color: adapter.defaultPackColor,
      itemIds: [],
      createdAt: Date.now(),
    };
    await persistPacks(upsertPack(packs, pack));
    return pack;
  }, [adapter, packs, persistPacks, scope]);

  const savePack = useCallback(async (pack: Pack) => {
    await persistPacks(upsertPack(packs, pack));
  }, [packs, persistPacks]);

  const deletePack = useCallback(async (id: string) => {
    await persistPacks(removePack(packs, id));
  }, [packs, persistPacks]);

  return {
    adapter,
    items,
    packs,
    loading,
    reload,
    saveItem,
    deleteItem,
    createPack,
    savePack,
    deletePack,
  };
}
