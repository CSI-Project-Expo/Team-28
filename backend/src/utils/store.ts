import { Issue } from './types';

/**
 * Simple in-memory store.
 * Replace with a real database (Postgres, MongoDB, etc.) for production.
 */

const store = new Map<string, Issue>();

export const issueStore = {
  save(issue: Issue): void {
    store.set(issue.id, issue);
  },

  findById(id: string): Issue | undefined {
    return store.get(id);
  },

  update(id: string, partial: Partial<Issue>): Issue | undefined {
    const existing = store.get(id);
    if (!existing) return undefined;
    const updated: Issue = { ...existing, ...partial, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  listAll(): Issue[] {
    return Array.from(store.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  size(): number {
    return store.size;
  },
};
