import { describe, it, expect } from 'vitest';
import { ArchiveSearchEngine } from '../src/core/vault/archive-search';
import { SavedTabItem } from '../src/ui/types';

describe('Archive Search Engine (PRD Epic 3.3)', () => {
  const sampleItems: SavedTabItem[] = [
    {
      id: 'item_1',
      vaultId: 'default',
      itemType: 'session',
      title: 'Game Development Hub & Unity Scripting',
      url: 'https://notion.so/gamedev',
      normalizedUrl: 'https://notion.so/gamedev',
      domain: 'notion.so',
      browserFamily: 'Edge',
      savedAt: '2026-10-24T10:00:00Z',
      notes: 'Contains references to physics shaders and raycasting algorithms.',
      archiveContent: 'Full article discussing collision layers, rigidbodies, and compute shaders.',
      isFavorite: true,
      collectionIds: ['dev'],
      tags: ['Game Dev', 'Unity', 'Shaders']
    },
    {
      id: 'item_2',
      vaultId: 'default',
      itemType: 'tab',
      title: 'ChatGPT Project Ideation',
      url: 'https://chat.openai.com/c/ideas',
      normalizedUrl: 'https://chat.openai.com/c/ideas',
      domain: 'chat.openai.com',
      browserFamily: 'Chrome',
      savedAt: '2026-10-23T10:00:00Z',
      notes: 'Brainstormed feature list and technical specifications.',
      archiveContent: 'Session logs exploring local-first databases, SQLite migrations, and Tauri Mica.',
      isFavorite: false,
      collectionIds: ['research'],
      tags: ['AI', 'Research']
    },
    {
      id: 'item_3_trash',
      vaultId: 'default',
      itemType: 'tab',
      title: 'Deleted Legacy Draft',
      url: 'https://example.com/deleted',
      normalizedUrl: 'https://example.com/deleted',
      domain: 'example.com',
      browserFamily: 'Edge',
      savedAt: '2026-10-20T10:00:00Z',
      notes: 'Should be excluded from active search.',
      archiveContent: 'Shaders and compute engines.',
      isFavorite: false,
      collectionIds: ['dev'],
      tags: ['Shaders'],
      deletedAt: '2026-10-24T00:00:00Z'
    }
  ];

  it('finds items by title match with high relevance score', () => {
    const results = ArchiveSearchEngine.search(sampleItems, 'Unity');
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe('item_1');
    expect(results[0].matchedFields).toContain('title');
  });

  it('searches full-text inside archiveContent', () => {
    const results = ArchiveSearchEngine.search(sampleItems, 'rigidbodies');
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe('item_1');
    expect(results[0].matchedFields).toContain('content');
    expect(results[0].snippet).toContain('rigidbodies');
  });

  it('excludes items currently in the trash', () => {
    const results = ArchiveSearchEngine.search(sampleItems, 'Shaders');
    expect(results.length).toBe(1);
    expect(results[0].item.id).toBe('item_1');
    expect(results.some(r => r.item.id === 'item_3_trash')).toBe(false);
  });

  it('filters results by collectionId', () => {
    const results = ArchiveSearchEngine.search(sampleItems, 'ideas', { collectionId: 'dev' });
    expect(results.length).toBe(0);

    const match = ArchiveSearchEngine.search(sampleItems, 'ideas', { collectionId: 'research' });
    expect(match.length).toBe(1);
    expect(match[0].item.id).toBe('item_2');
  });

  it('returns empty array when query is blank or whitespace', () => {
    expect(ArchiveSearchEngine.search(sampleItems, '')).toEqual([]);
    expect(ArchiveSearchEngine.search(sampleItems, '   ')).toEqual([]);
  });
});
