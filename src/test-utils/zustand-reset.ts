// src/test-utils/zustand-reset.ts
import { create as actualCreate, StateCreator } from 'zustand';
import { act } from '@testing-library/react';

const resetFns = new Set<() => void>();

export const create = <T>(fn: StateCreator<T>) => {
  const store = actualCreate(fn);
  const initial = store.getState();
  resetFns.add(() => store.setState(initial, true));
  return store;
};

export const resetAllStores = () => {
  act(() => {
    resetFns.forEach(fn => fn());
  });
};

// Auto-reset stores before each test
beforeEach(() => {
  resetAllStores();
}); 