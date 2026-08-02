import { useSyncExternalStore } from 'react';
import { STATUSES, type Status } from './colors';

/**
 * A tiny external store for per-item status.
 *
 * The point of this file is the "flip the colours at X Hz" test: keeping the
 * statuses out of React state means a tick does not re-render the Tree View (and
 * therefore does not re-run virtualization). Only the handful of items that are
 * currently mounted have a subscriber, so a tick re-renders ~30 dots instead of
 * 22k, and it stays smooth at high frequencies.
 */
class StatusStore {
  private statuses = new Map<string, Status>();

  private listeners = new Map<string, Set<() => void>>();

  /** Bumped on every tick; lets a component subscribe to "any change". */
  private globalVersion = 0;

  private globalListeners = new Set<() => void>();

  seed(ids: string[]) {
    ids.forEach((id, index) => {
      this.statuses.set(id, STATUSES[index % STATUSES.length]);
    });
  }

  get(id: string): Status {
    return this.statuses.get(id) ?? 'idle';
  }

  getVersion = () => this.globalVersion;

  subscribe = (id: string, listener: () => void) => {
    let set = this.listeners.get(id);
    if (!set) {
      set = new Set();
      this.listeners.set(id, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
      if (set!.size === 0) {
        this.listeners.delete(id);
      }
    };
  };

  subscribeGlobal = (listener: () => void) => {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  };

  /**
   * Randomises the status of every id, then notifies only the ids that actually
   * have a mounted subscriber.
   */
  randomizeAll(ids: string[]) {
    for (const id of ids) {
      this.statuses.set(id, STATUSES[Math.floor(Math.random() * STATUSES.length)]);
    }
    this.globalVersion += 1;
    for (const listeners of this.listeners.values()) {
      listeners.forEach((listener) => listener());
    }
    this.globalListeners.forEach((listener) => listener());
  }

  set(id: string, status: Status) {
    this.statuses.set(id, status);
    this.globalVersion += 1;
    this.listeners.get(id)?.forEach((listener) => listener());
    this.globalListeners.forEach((listener) => listener());
  }
}

export const statusStore = new StatusStore();

/** Subscribes a single tree item to its own status only. */
export function useItemStatus(id: string): Status {
  return useSyncExternalStore(
    (listener) => statusStore.subscribe(id, listener),
    () => statusStore.get(id),
  );
}

/** Subscribes to "something changed", used by the tick counter in the toolbar. */
export function useStatusVersion(): number {
  return useSyncExternalStore(statusStore.subscribeGlobal, statusStore.getVersion);
}
