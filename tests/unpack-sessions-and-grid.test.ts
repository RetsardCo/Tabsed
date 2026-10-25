import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  unpackSessionItem,
  unpackAllSessionItems,
  groupTabsBySession,
  extractDomainFromUrl
} from '../src/core/vault/unpack-sessions';
import { TabGrid } from '../src/ui/components/TabGrid';
import { SavedTabItem } from '../src/ui/types';

describe('Individual Tabs First Architecture (PRD Visual Tab Grid & Personalization)', () => {
  const sampleSessionItem: SavedTabItem = {
    id: 'session_edge_105',
    vaultId: 'default',
    itemType: 'session',
    title: 'COSci Faculty Document Submission Form and 104 more tabs',
    url: 'https://docs.google.com/forms/sample',
    normalizedUrl: 'https://docs.google.com/forms/sample',
    domain: 'docs.google.com',
    faviconUrl: 'https://docs.google.com/favicon.ico',
    thumbnailUrl: 'https://images.unsplash.com/photo-sample',
    browserFamily: 'Edge',
    savedAt: '2026-10-25T08:00:00Z',
    notes: 'Saved window session with 105 tabs',
    isFavorite: true,
    collectionIds: ['inbox'],
    tags: ['Extension', 'Saved Window', 'Edge'],
    tabCount: 3,
    availabilityStatus: 'reachable',
    sessionTabs: [
      {
        id: 'sub_0',
        title: 'COSci Faculty Document Submission Form',
        url: 'https://docs.google.com/forms/sample',
        domain: 'docs.google.com',
        faviconUrl: 'https://docs.google.com/favicon.ico'
      },
      {
        id: 'sub_1',
        title: 'CHED SDG Curriculum Update 2026.xlsx',
        url: 'https://docs.google.com/spreadsheets/sample',
        domain: 'docs.google.com',
        faviconUrl: 'https://docs.google.com/favicon.ico'
      },
      {
        id: 'sub_2',
        title: 'Open3DLab Genshin Props',
        url: 'https://open3dlab.com/project/1',
        domain: 'open3dlab.com',
        faviconUrl: 'https://open3dlab.com/favicon.ico'
      }
    ]
  };

  it('unpacks a multi-tab session into individual SavedTabItem cards', () => {
    const unpacked = unpackSessionItem(sampleSessionItem);

    expect(unpacked.length).toBe(3);

    // Every tab is now an individual 'tab' itemType
    expect(unpacked[0].itemType).toBe('tab');
    expect(unpacked[0].title).toBe('COSci Faculty Document Submission Form');
    expect(unpacked[0].domain).toBe('docs.google.com');
    expect(unpacked[0].windowSessionId).toBe('session_edge_105');
    expect(unpacked[0].sessionTitle).toBe('COSci Faculty Document Submission Form and 104 more tabs');

    expect(unpacked[1].itemType).toBe('tab');
    expect(unpacked[1].title).toBe('CHED SDG Curriculum Update 2026.xlsx');
    expect(unpacked[1].windowSessionId).toBe('session_edge_105');

    expect(unpacked[2].itemType).toBe('tab');
    expect(unpacked[2].title).toBe('Open3DLab Genshin Props');
    expect(unpacked[2].domain).toBe('open3dlab.com');
    expect(unpacked[2].windowSessionId).toBe('session_edge_105');
  });

  it('passes single tab items through unchanged without modification', () => {
    const singleTab: SavedTabItem = {
      id: 'tab_single_1',
      vaultId: 'default',
      itemType: 'tab',
      title: 'Tauri Framework Documentation',
      url: 'https://tauri.app',
      normalizedUrl: 'https://tauri.app',
      domain: 'tauri.app',
      browserFamily: 'Chrome',
      savedAt: '2026-10-25T08:00:00Z',
      notes: '',
      isFavorite: false,
      collectionIds: ['dev'],
      tags: ['Tauri'],
      tabCount: 1,
      availabilityStatus: 'reachable'
    };

    const unpacked = unpackAllSessionItems([singleTab]);
    expect(unpacked.length).toBe(1);
    expect(unpacked[0].id).toBe('tab_single_1');
    expect(unpacked[0].title).toBe('Tauri Framework Documentation');
  });

  it('correctly extracts domains from diverse protocols including local files and https', () => {
    expect(extractDomainFromUrl('https://docs.google.com/spreadsheets/d/123')).toBe('docs.google.com');
    expect(extractDomainFromUrl('https://www.github.com/rust-lang/rust')).toBe('github.com');
    expect(extractDomainFromUrl('file:///C:/Users/Kurados/Downloads/CCCS101.pdf')).toBe('local-file');
    expect(extractDomainFromUrl('')).toBe('');
  });

  it('groups individual tabs back into session cards when groupTabsBySession is toggled', () => {
    const unpacked = unpackSessionItem(sampleSessionItem);
    const regrouped = groupTabsBySession(unpacked);

    expect(regrouped.length).toBe(1);
    expect(regrouped[0].itemType).toBe('session');
    expect(regrouped[0].id).toBe('session_edge_105');
    expect(regrouped[0].tabCount).toBe(3);
    expect(regrouped[0].sessionTabs?.length).toBe(3);
  });

  it('TabGrid renders inline Quick Add card and individual tab cards with domain badges', () => {
    const unpacked = unpackSessionItem(sampleSessionItem);

    const html = renderToString(
      React.createElement(TabGrid, {
        items: unpacked,
        selectedItemId: null,
        onSelectItem: () => {},
        onToggleFavorite: () => {},
        onDeleteItem: () => {},
        onOpenLiveUrl: () => {},
        isTrash: false,
        onQuickAddUrl: () => {},
        groupMode: 'individual'
      })
    );

    // Verify Inline Quick Add Card renders
    expect(html).toContain('Quick Add');
    expect(html).toContain('Paste link or type URL to save as individual card...');
    expect(html).toContain('Save');

    // Verify all 3 individual cards rendered with titles
    expect(html).toContain('COSci Faculty Document Submission Form');
    expect(html).toContain('CHED SDG Curriculum Update 2026.xlsx');
    expect(html).toContain('Open3DLab Genshin Props');

    // Verify required accessibility and action attributes are present
    expect(html).toContain('title="Move to Trash"');
    expect(html).toContain('aria-label="Move to Trash"');
  });

  it('validates extension popup HTML and JS contract: 3 modes, options toggles, no blocking confirms', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const htmlContent = fs.readFileSync(path.resolve(__dirname, '../extension/popup.html'), 'utf8');
    const jsContent = fs.readFileSync(path.resolve(__dirname, '../extension/popup.js'), 'utf8');

    // 1. Verify 3 segmented tabs exist
    expect(htmlContent).toContain('id="mode-tab-active"');
    expect(htmlContent).toContain('id="mode-tab-select"');
    expect(htmlContent).toContain('id="mode-tab-all"');

    // 2. Verify all 3 mode views exist
    expect(htmlContent).toContain('id="view-active-mode"');
    expect(htmlContent).toContain('id="view-select-mode"');
    expect(htmlContent).toContain('id="view-all-mode"');

    // 3. Verify Active Tab preview is present
    expect(htmlContent).toContain('id="active-tab-card"');
    expect(htmlContent).toContain('id="active-tab-title"');
    expect(htmlContent).toContain('id="active-tab-domain"');

    // 4. Verify single primary action button per mode
    expect(htmlContent).toContain('id="save-active-tab-btn"');
    expect(htmlContent).toContain('id="save-selected-tabs-btn"');
    expect(htmlContent).toContain('id="save-all-tabs-btn"');

    // 5. Verify Close tabs after saving options exist
    expect(htmlContent).toContain('id="close-after-save-active"');
    expect(htmlContent).toContain('id="close-after-save-select"');
    expect(htmlContent).toContain('id="close-after-save-all"');

    // 6. Verify NO window.confirm or alert calls in popup.js
    expect(jsContent).not.toContain('confirm(');
    expect(jsContent).not.toContain('alert(');
  });
});
