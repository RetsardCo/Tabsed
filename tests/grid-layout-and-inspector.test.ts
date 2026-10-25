import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DetailInspector } from '../src/ui/components/DetailInspector';
import { TabGrid } from '../src/ui/components/TabGrid';
import { SavedTabItem } from '../src/ui/types';
import { ErrorBoundary } from '../src/ui/components/ErrorBoundary';
import { SmartBrandThumbnail } from '../src/ui/components/SmartBrandThumbnail';

const createSampleTab = (overrides: Partial<SavedTabItem> = {}): SavedTabItem => ({
  id: 'tab_test_1',
  vaultId: 'default',
  itemType: 'tab',
  title: 'Anthropic AI Research',
  url: 'https://anthropic.com/research',
  normalizedUrl: 'https://anthropic.com/research',
  domain: 'anthropic.com',
  faviconUrl: 'https://anthropic.com/favicon.ico',
  thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11',
  browserFamily: 'Chrome',
  savedAt: '2026-10-25T12:00:00Z',
  notes: 'Key breakthrough in constitutional AI architectures.',
  isFavorite: true,
  collectionIds: ['inbox'],
  tags: ['AI', 'Research'],
  tabCount: 1,
  archiveSizeBytes: 204800,
  availabilityStatus: 'reachable',
  ...overrides
});

describe('Grid Preferences, Note Badges & DetailInspector Overlay Suite', () => {
  describe('1. DetailInspector Overlay Modal', () => {
    it('renders as a modal overlay with role="dialog" and aria-modal="true" to prevent grid layout shifting', () => {
      const item = createSampleTab();
      const html = renderToString(
        React.createElement(DetailInspector, {
          item: item,
          onClose: () => {},
          onUpdateNotes: () => {},
          onAddTag: () => {},
          onRemoveTag: () => {},
          onOpenLiveUrl: () => {},
          onCheckAvailability: () => {}
        })
      );

      // Verify modal accessibility and overlay attributes
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-label="Tab Details Inspector"');
      expect(html).toContain('position:fixed');
      expect(html).toContain('backdrop-filter:blur(10px)');

      // Verify Middle/Left Preview Viewport
      expect(html).toContain('Open Live');
      expect(html).toContain(item.url);
      expect(html).toContain('title="Copy URL"');

      // Verify Screenshot Thumbnail is rendered
      expect(html).toContain(item.thumbnailUrl);

      // Verify Right Inspector Panel with metadata and notes
      expect(html).toContain(item.notes);
      expect(html).toContain('Key breakthrough in constitutional AI architectures.');
      expect(html).toContain('Anthropic AI Research');
      expect(html).toContain('anthropic.com');
      expect(html).toContain('200 KB');
    });

    it('renders sub-tab switcher strip when session contains multiple tabs', () => {
      const multiTabSession = createSampleTab({
        id: 'session_1',
        itemType: 'session',
        title: 'Kubernetes Multi-Cluster Session',
        tabCount: 2,
        sessionTabs: [
          {
            id: 'sub_1',
            title: 'Kubernetes Pods',
            url: 'https://kubernetes.io/docs/concepts/workloads/pods/',
            domain: 'kubernetes.io'
          },
          {
            id: 'sub_2',
            title: 'Kubernetes Services',
            url: 'https://kubernetes.io/docs/concepts/services-networking/service/',
            domain: 'kubernetes.io'
          }
        ]
      });

      const html = renderToString(
        React.createElement(DetailInspector, {
          item: multiTabSession,
          onClose: () => {},
          onUpdateNotes: () => {},
          onAddTag: () => {},
          onRemoveTag: () => {},
          onOpenLiveUrl: () => {},
          onCheckAvailability: () => {}
        })
      );

      expect(html).toContain('Kubernetes Pods');
      expect(html).toContain('Kubernetes Services');
    });
  });

  describe('2. TabGrid Column Preferences & Card Sizing', () => {
    it('applies custom grid columns preference', () => {
      const items = [createSampleTab({ id: 'item_1' }), createSampleTab({ id: 'item_2' })];

      // Auto columns
      const htmlAuto = renderToString(
        React.createElement(TabGrid, {
          items: items,
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          gridColumns: 'auto'
        })
      );
      expect(htmlAuto).toContain('repeat(auto-fill, minmax(310px, 1fr))');

      // 4 explicit columns
      const html4Cols = renderToString(
        React.createElement(TabGrid, {
          items: items,
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          gridColumns: 4
        })
      );
      expect(html4Cols).toContain('repeat(4, minmax(0, 1fr))');

      // 2 explicit columns
      const html2Cols = renderToString(
        React.createElement(TabGrid, {
          items: items,
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          gridColumns: 2
        })
      );
      expect(html2Cols).toContain('repeat(2, minmax(0, 1fr))');
    });

    it('applies card density preferences (compact, medium, large)', () => {
      const items = [createSampleTab()];

      // Compact: 118px thumbnail
      const htmlCompact = renderToString(
        React.createElement(TabGrid, {
          items: items,
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          cardSize: 'compact'
        })
      );
      expect(htmlCompact).toContain('height:118px');

      // Large: 205px thumbnail
      const htmlLarge = renderToString(
        React.createElement(TabGrid, {
          items: items,
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {},
          cardSize: 'large'
        })
      );
      expect(htmlLarge).toContain('height:205px');
    });
  });

  describe('3. Tab Card Notes Direct Display', () => {
    it('renders note snippet badge on cards in TabGrid when notes are present', () => {
      const tabWithNote = createSampleTab({
        id: 'tab_note_1',
        notes: 'Critical benchmark results for Llama-3 fine-tuning.'
      });

      const html = renderToString(
        React.createElement(TabGrid, {
          items: [tabWithNote],
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {}
        })
      );

      expect(html).toContain('Critical benchmark results for Llama-3 fine-tuning.');
      expect(html).toContain('title="Note: Critical benchmark results for Llama-3 fine-tuning."');
    });

    it('does not render note snippet badge when notes are empty', () => {
      const tabWithoutNote = createSampleTab({
        id: 'tab_note_2',
        notes: ''
      });

      const html = renderToString(
        React.createElement(TabGrid, {
          items: [tabWithoutNote],
          selectedItemId: null,
          onSelectItem: () => {},
          onToggleFavorite: () => {},
          onDeleteItem: () => {},
          onRestoreItem: () => {},
          onOpenLiveUrl: () => {}
        })
      );

      expect(html).not.toContain('title="Note:');
    });
  });

  describe('4. ErrorBoundary Resilience', () => {
    it('captures errors via getDerivedStateFromError and renders recovery UI', () => {
      const err = new Error('Simulated modal component explosion');
      const derived = ErrorBoundary.getDerivedStateFromError(err);
      expect(derived.hasError).toBe(true);
      expect(derived.error?.message).toBe('Simulated modal component explosion');

      const boundary = new ErrorBoundary({ children: null });
      boundary.state = { hasError: true, error: err };
      const html = renderToString(boundary.render() as React.ReactElement);

      expect(html).toContain('Something went wrong');
      expect(html).toContain('Simulated modal component explosion');
      expect(html).toContain('Dismiss &amp; Recover');
    });
  });

  describe('5. SmartBrandThumbnail & 1x1 Placeholder Filtering', () => {
    it('renders real image thumbnail when valid URL is provided', () => {
      const html = renderToString(
        React.createElement(SmartBrandThumbnail, {
          domain: 'github.com',
          url: 'https://github.com/facebook/react',
          title: 'React Repository',
          thumbnailUrl: 'https://images.unsplash.com/photo-example.jpg'
        })
      );

      expect(html).toContain('<img');
      expect(html).toContain('src="https://images.unsplash.com/photo-example.jpg"');
      expect(html).toContain('alt="React Repository"');
    });

    it('filters out 1x1 transparent dummy PNG and renders rich brand preview', () => {
      const dummy1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = renderToString(
        React.createElement(SmartBrandThumbnail, {
          domain: 'notion.so',
          url: 'https://notion.so/workspace',
          title: 'Notion Workspace',
          thumbnailUrl: dummy1x1
        })
      );

      // Should NOT render the 1x1 img tag or full screenshot cover
      expect(html).not.toContain(dummy1x1);
      expect(html).not.toContain('object-fit:cover');

      // Should render the rich brand card with window controls and badge
      expect(html).toContain('notion.so');
    });

    it('falls back to rich brand preview when thumbnailUrl is null or undefined', () => {
      const html = renderToString(
        React.createElement(SmartBrandThumbnail, {
          domain: 'react.dev',
          url: 'https://react.dev',
          title: 'React Documentation',
          thumbnailUrl: null
        })
      );

      expect(html).not.toContain('object-fit:cover');
      expect(html).toContain('react.dev');
    });

    it('DetailInspector falls back to SmartBrandThumbnail when tab has 1x1 placeholder thumbnail', () => {
      const dummy1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const tabWithDummy = createSampleTab({
        thumbnailUrl: dummy1x1,
        domain: 'docs.google.com',
        title: 'Google Docs Document'
      });

      const html = renderToString(
        React.createElement(DetailInspector, {
          item: tabWithDummy,
          onClose: () => {},
          onUpdateNotes: () => {},
          onAddTag: () => {},
          onRemoveTag: () => {},
          onOpenLiveUrl: () => {},
          onCheckAvailability: () => {}
        })
      );

      // The preview area in DetailInspector should NOT render the dummy 1x1 image tag
      expect(html).not.toContain(`src="${dummy1x1}"`);
      // It should render the brand badge instead
      expect(html).toContain('Google Docs');
    });
  });
});
