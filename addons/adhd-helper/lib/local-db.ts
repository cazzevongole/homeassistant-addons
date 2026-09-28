import type { EntityKind, PendingOp, SyncOp } from './types';

const DB_NAME = 'adhd-helper';
const DB_VERSION = 1;
const STORE = 'kv';
const PENDING_KEY = 'pending-ops';
const LAST_SYNC_KEY = 'last-sync';
const XP_SEEN_KEY = 'xp-seen';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const rq = tx.objectStore(STORE).get(key);
    rq.onsuccess = () => resolve((rq.result as T) ?? null);
    rq.onerror = () => reject(rq.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export type LocalData = {
  tasks: unknown[];
  planner: unknown[];
  focus: unknown[];
  habits: unknown[];
  habit_logs: unknown[];
  notes: unknown[];
};

export const EMPTY_DATA: LocalData = {
  tasks: [], planner: [], focus: [], habits: [], habit_logs: [], notes: [],
};

export async function loadLocalData(): Promise<LocalData> {
  const raw = await idbGet<LocalData>('data');
  return raw ?? structuredClone(EMPTY_DATA);
}

export async function saveLocalData(data: LocalData): Promise<void> {
  await idbSet('data', data);
}

export async function getPendingOps(): Promise<PendingOp[]> {
  return (await idbGet<PendingOp[]>(PENDING_KEY)) ?? [];
}

export async function setPendingOps(ops: PendingOp[]): Promise<void> {
  await idbSet(PENDING_KEY, ops);
}

export async function queueOp(table: EntityKind, op: SyncOp, row: Record<string, unknown>): Promise<PendingOp[]> {
  const ops = await getPendingOps();
  ops.push({ table, op, row });
  await setPendingOps(ops);
  return ops;
}

export async function getLastSync(): Promise<string | null> {
  return idbGet<string>(LAST_SYNC_KEY);
}

export async function setLastSync(iso: string): Promise<void> {
  await idbSet(LAST_SYNC_KEY, iso);
}

export async function getXpSeen(): Promise<number> {
  return (await idbGet<number>(XP_SEEN_KEY)) ?? 0;
}

export async function setXpSeen(v: number): Promise<void> {
  await idbSet(XP_SEEN_KEY, v);
}

export async function clearUserData(): Promise<void> {
  await saveLocalData(structuredClone(EMPTY_DATA));
  await setPendingOps([]);
  await setLastSync(new Date().toISOString());
}
