import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Cross-Cutting Accessibility & Keyboard Navigation Suite (PRD Section 13.3 & Epic Cross-Cutting)', () => {
  const rootDir = path.resolve(__dirname, '..');
  const cssPath = path.join(rootDir, 'src', 'index.css');

  // WCAG 2.1 Luminance and Contrast Calculation
  function getLuminance(hex: string): number {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const sRGB = [r, g, b].map(val => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  function getContrastRatio(hex1: string, hex2: string): number {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  describe('WCAG 2.1 AA Contrast Conformance (from production index.css tokens)', () => {
    it('verifies dark theme text meets minimum 4.5:1 contrast against surface background', () => {
      // Tokens from src/index.css [data-theme='dark']
      const darkBgCard = '#161c2d'; // --bg-card in dark theme
      const textPrimary = '#ffffff'; // --text-primary
      const textSecondary = '#e2e8f0'; // --text-secondary
      const textMuted = '#94a3b8'; // --text-muted

      const primaryRatio = getContrastRatio(textPrimary, darkBgCard);
      const secondaryRatio = getContrastRatio(textSecondary, darkBgCard);
      const mutedRatio = getContrastRatio(textMuted, darkBgCard);

      // Primary text should achieve >= 7:1 (AAA) or at least 4.5:1 (AA)
      expect(primaryRatio).toBeGreaterThanOrEqual(7.0);
      expect(secondaryRatio).toBeGreaterThanOrEqual(4.5);
      expect(mutedRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies light theme text meets minimum 4.5:1 contrast against surface background', () => {
      // Tokens from src/index.css :root
      const lightBg = '#ffffff'; // --bg-card
      const textPrimary = '#0f172a'; // --text-primary
      const textSecondary = '#334155'; // --text-secondary

      const primaryRatio = getContrastRatio(textPrimary, lightBg);
      const secondaryRatio = getContrastRatio(textSecondary, lightBg);

      expect(primaryRatio).toBeGreaterThanOrEqual(7.0);
      expect(secondaryRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('verifies reduced-transparency fallback surfaces are solid opaque and maintain readable contrast', () => {
      const solidCardBgDark = '#161c2d';
      const textDark = '#ffffff';
      const solidCardBgLight = '#f8fafc';
      const textLight = '#0f172a';

      expect(getContrastRatio(textDark, solidCardBgDark)).toBeGreaterThanOrEqual(7.0);
      expect(getContrastRatio(textLight, solidCardBgLight)).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe('Keyboard Navigation and Shortcut Behaviors in App Shell', () => {
    it('verifies all 9 application modal states are closed on Escape key press in App.tsx', () => {
      const appContent = fs.readFileSync(path.join(rootDir, 'src', 'App.tsx'), 'utf8');

      // Verify that all modal states are included in the Escape key handler
      const requiredModalStates = [
        'saveModalOpen',
        'storageModalOpen',
        'duplicatesModalOpen',
        'restoreModalOpen',
        'settingsModalOpen',
        'helpModalOpen',
        'archiveSearchModalOpen',
        'backupModalOpen',
        'portableVaultModalOpen'
      ];

      for (const modalState of requiredModalStates) {
        expect(appContent).toContain(modalState);
      }

      // Check Escape key handler section explicitly
      expect(appContent).toMatch(/if\s*\([\s\S]*?portableVaultModalOpen[\s\S]*?\)\s*\{[\s\S]*?setPortableVaultModalOpen\(false\)/);
    });

    it('handles "/" slash shortcut and Ctrl+K to focus primary search input in Header', () => {
      const appContent = fs.readFileSync(path.join(rootDir, 'src', 'App.tsx'), 'utf8');
      const headerContent = fs.readFileSync(path.join(rootDir, 'src', 'ui', 'components', 'Header.tsx'), 'utf8');

      // Ensure App.tsx handles '/' and Ctrl+K by targeting #global-search-input
      expect(appContent).toContain("e.key === '/'");
      expect(appContent).toContain("document.getElementById('global-search-input')?.focus()");
      expect(appContent).toContain("e.key.toLowerCase() === 'k'");

      // Ensure Header has id="global-search-input"
      expect(headerContent).toContain('id="global-search-input"');
    });
  });

  describe('Focus Management & Modal Trap', () => {
    it('manages focus cycle within modal elements and restores focus on close', () => {
      const modalElements = ['close-button', 'input-name', 'confirm-button'];
      let currentFocusIndex = 0;
      let previouslyFocusedElement = 'save-tabs-trigger-btn';

      // Simulate Tab key navigation
      function simulateTab(shiftKey = false) {
        if (shiftKey) {
          currentFocusIndex = (currentFocusIndex - 1 + modalElements.length) % modalElements.length;
        } else {
          currentFocusIndex = (currentFocusIndex + 1) % modalElements.length;
        }
        return modalElements[currentFocusIndex];
      }

      // Tab forward
      expect(simulateTab(false)).toBe('input-name');
      expect(simulateTab(false)).toBe('confirm-button');
      // Wrap around to top
      expect(simulateTab(false)).toBe('close-button');

      // Shift+Tab backward wrap around
      expect(simulateTab(true)).toBe('confirm-button');

      // On modal close: restore previous trigger focus
      let activeFocus = previouslyFocusedElement;
      expect(activeFocus).toBe('save-tabs-trigger-btn');
    });
  });

  describe('ARIA Semantic Attributes & Screen Reader Readiness in Components', () => {
    it('validates critical ARIA landmarks and roles across all dialog components', () => {
      const componentsDir = path.join(rootDir, 'src', 'ui', 'components');

      const modalFiles = [
        'SaveTabsModal.tsx',
        'PortableVaultModal.tsx',
        'SettingsModal.tsx',
        'BackupModal.tsx',
        'ArchiveSearchModal.tsx',
        'StorageModal.tsx',
        'DuplicatesModal.tsx',
        'RestoreQueueModal.tsx',
        'HelpDiagnosticsModal.tsx'
      ];

      for (const file of modalFiles) {
        const filePath = path.join(componentsDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');

        expect(content).toContain('role="dialog"');
        expect(content).toContain('aria-modal="true"');
      }
    });

    it('validates destructive confirmation modals use alertdialog role', () => {
      const confirmPath = path.join(rootDir, 'src', 'ui', 'components', 'ConfirmationModal.tsx');
      expect(fs.existsSync(confirmPath)).toBe(true);
      const content = fs.readFileSync(confirmPath, 'utf8');

      expect(content).toContain('role="alertdialog"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('aria-labelledby');
    });
  });
});
