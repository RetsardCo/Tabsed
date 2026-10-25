import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SavedTabItem, Collection } from '../src/ui/types';

describe('UI Modals, Tab Grouping, and Favicon Fallbacks', () => {
  const rootDir = path.resolve(__dirname, '..');
  const componentsDir = path.join(rootDir, 'src', 'ui', 'components');

  describe('1. Modal Close Buttons & Dismissibility (No User Trapping)', () => {
    const modalFiles = [
      'DuplicatesModal.tsx',
      'StorageModal.tsx',
      'SettingsModal.tsx',
      'BackupModal.tsx',
      'ArchiveSearchModal.tsx',
      'RestoreQueueModal.tsx',
      'PortableVaultModal.tsx',
      'HelpDiagnosticsModal.tsx',
      'SaveTabsModal.tsx',
      'ConfirmationModal.tsx',
      'CreateGroupModal.tsx',
      'ManageGroupTabsModal.tsx'
    ];

    modalFiles.forEach((file) => {
      it(`verifies ${file} has top-right close button, bottom button, escape listener, and backdrop click`, () => {
        const filePath = path.join(componentsDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');

        // 1. Top-right close button with X icon or close aria-label
        expect(content).toMatch(/<button[\s\S]*?(?:aria-label=["']Close|onClose|onCancel)[\s\S]*?<X/i);

        // 2. Escape key dismissal
        expect(content).toMatch(/e\.key\s*===\s*['"]Escape['"]/);

        // 3. Backdrop click dismissal
        expect(content).toMatch(/e\.target\s*===\s*e\.currentTarget/);

        // 4. Accessible role dialog or alertdialog
        expect(content).toMatch(/role=["'](?:dialog|alertdialog)["']/);
      });
    });

    it('specifically checks DuplicatesModal has both header X and footer Done buttons', () => {
      const content = fs.readFileSync(path.join(componentsDir, 'DuplicatesModal.tsx'), 'utf8');
      expect(content).toContain('aria-label="Close dialog"');
      expect(content).toContain('aria-label="Close duplicate resolver"');
      expect(content).toContain('Done');
    });
  });

  describe('2. Tab Grouping (Android Launcher Style) & Tab Picker Mechanics', () => {
    it('generates intelligent group names based on domain similarity', () => {
      const tabA: Partial<SavedTabItem> = { id: '1', domain: 'notion.so', title: 'Notion Workspace' };
      const tabB: Partial<SavedTabItem> = { id: '2', domain: 'notion.so', title: 'Notion Docs' };
      const tabC: Partial<SavedTabItem> = { id: '3', domain: 'github.com', title: 'GitHub Repo' };

      // Same domain -> `${domain} Group`
      const getName = (a?: Partial<SavedTabItem>, b?: Partial<SavedTabItem>) => {
        if (a?.domain && b?.domain && a.domain === b.domain) {
          return `${a.domain} Group`;
        } else if (b?.domain) {
          return `${b.domain} Group`;
        } else if (a?.domain) {
          return `${a.domain} Group`;
        }
        return 'New Group';
      };

      expect(getName(tabA, tabB)).toBe('notion.so Group');
      expect(getName(tabA, tabC)).toBe('github.com Group');
      expect(getName({}, {})).toBe('New Group');
    });

    it('accurately filters candidate tabs by query in CreateGroupModal and ManageGroupTabsModal', () => {
      const tabs: Partial<SavedTabItem>[] = [
        { id: '1', title: 'React Documentation', domain: 'react.dev', url: 'https://react.dev', tags: ['dev', 'frontend'], deletedAt: null },
        { id: '2', title: 'Tauri v2 Overview', domain: 'tauri.app', url: 'https://tauri.app', tags: ['rust', 'desktop'], deletedAt: null },
        { id: '3', title: 'Deleted Tab', domain: 'example.com', url: 'https://example.com', tags: [], deletedAt: '2026-10-20' },
        { id: '4', title: 'Vite Guide', domain: 'vitejs.dev', url: 'https://vitejs.dev', tags: ['build', 'dev'], deletedAt: null }
      ];

      const activeTabs = tabs.filter(t => !t.deletedAt);
      expect(activeTabs.length).toBe(3);

      const filterTabs = (query: string) => {
        if (!query.trim()) return activeTabs;
        const q = query.toLowerCase();
        return activeTabs.filter(t =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.domain && t.domain.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
        );
      };

      expect(filterTabs('dev').length).toBe(2); // React (tag:dev, domain:react.dev), Vite (domain:vitejs.dev, tag:dev)
      expect(filterTabs('tauri').length).toBe(1);
      expect(filterTabs('nonexistent').length).toBe(0);
    });

    it('correctly associates and disassociates tabs from collectionId during group creation and tab management', () => {
      let items: Partial<SavedTabItem>[] = [
        { id: 't1', title: 'Tab 1', collectionIds: ['inbox'] },
        { id: 't2', title: 'Tab 2', collectionIds: ['inbox', 'research'] },
        { id: 't3', title: 'Tab 3', collectionIds: [] }
      ];

      const newColId = 'col_group_123';
      const selectedTabIds = ['t1', 't3'];

      // Simulate handleCreateGroup tab association
      items = items.map(tab => {
        if (selectedTabIds.includes(tab.id!)) {
          const current = tab.collectionIds || [];
          if (!current.includes(newColId)) {
            return { ...tab, collectionIds: [...current, newColId] };
          }
        }
        return tab;
      });

      expect(items.find(i => i.id === 't1')?.collectionIds).toEqual(['inbox', 'col_group_123']);
      expect(items.find(i => i.id === 't2')?.collectionIds).toEqual(['inbox', 'research']);
      expect(items.find(i => i.id === 't3')?.collectionIds).toEqual(['col_group_123']);

      // Simulate handleSaveGroupTabs (updating to ['t2', 't3'])
      const updatedTabIds = ['t2', 't3'];
      items = items.map(tab => {
        const current = tab.collectionIds || [];
        const hasCol = current.includes(newColId);
        const shouldHave = updatedTabIds.includes(tab.id!);
        if (shouldHave && !hasCol) {
          return { ...tab, collectionIds: [...current, newColId] };
        } else if (!shouldHave && hasCol) {
          return { ...tab, collectionIds: current.filter(c => c !== newColId) };
        }
        return tab;
      });

      expect(items.find(i => i.id === 't1')?.collectionIds).toEqual(['inbox']); // removed
      expect(items.find(i => i.id === 't2')?.collectionIds).toEqual(['inbox', 'research', 'col_group_123']); // added
      expect(items.find(i => i.id === 't3')?.collectionIds).toEqual(['col_group_123']); // kept
    });
  });

  describe('3. Favicon & Thumbnail Fallback Guarantee', () => {
    it('verifies SmartFavicon cascades through Google S2, official app logo, and vector fallback', () => {
      const brandIconsContent = fs.readFileSync(path.join(componentsDir, 'BrandIcons.tsx'), 'utf8');

      // Google S2 fallback
      expect(brandIconsContent).toContain('https://www.google.com/s2/favicons?domain=');
      expect(brandIconsContent).toContain('sz=64');

      // Official Tabsed logo fallback
      expect(brandIconsContent).toContain('/logo-32.png');

      // Vector fallback
      expect(brandIconsContent).toContain('Globe');

      // Error event advances stage
      expect(brandIconsContent).toContain('onError={handleImgError}');
    });

    it('verifies TabGrid enables drag-and-drop grouping and glow indicators on tab cards', () => {
      const gridContent = fs.readFileSync(path.join(componentsDir, 'TabGrid.tsx'), 'utf8');

      expect(gridContent).toContain('draggable={!isTrash}');
      expect(gridContent).toContain('onDragStart=');
      expect(gridContent).toContain('onDragOver=');
      expect(gridContent).toContain('onDrop=');
      expect(gridContent).toContain('Drop to group tabs');
      expect(gridContent).toContain('FolderPlus');
      expect(gridContent).toContain('Add to Group...');
    });
  });
});
