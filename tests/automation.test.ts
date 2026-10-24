import { describe, it, expect, vi } from 'vitest';
import {
  AutomationEngine,
  DEFAULT_PROTECTION_RULES,
  DEFAULT_AUTOMATION_RULES
} from '../src/core/automation/automation-engine';
import { CandidateTab, AutomationRule, AutomationProtectionRules } from '../src/ui/types';

describe('Epic 4.4 --- Automation Engine & Protected Tab Rules', () => {
  const candidateTabs: CandidateTab[] = [
    {
      id: 'tab_pinned_1',
      title: 'Pinned Dashboard',
      url: 'https://analytics.example.com',
      domain: 'analytics.example.com',
      pinned: true,
      lastActiveMinutesAgo: 180
    },
    {
      id: 'tab_allowed_domain',
      title: 'GitHub PR Review',
      url: 'https://github.com/org/repo/pull/12',
      domain: 'github.com',
      pinned: false,
      lastActiveMinutesAgo: 120
    },
    {
      id: 'tab_work_col',
      title: 'Work Sprint Roadmap',
      url: 'https://jira.example.com/browse/PROJ-1',
      domain: 'jira.example.com',
      collectionIds: ['work'],
      pinned: false,
      lastActiveMinutesAgo: 150
    },
    {
      id: 'tab_private',
      title: 'Incognito Tab',
      url: 'https://private.example.com',
      domain: 'private.example.com',
      isPrivate: true,
      pinned: false,
      lastActiveMinutesAgo: 90
    },
    {
      id: 'tab_idle_candidate',
      title: 'Random Tech Article',
      url: 'https://medium.com/@author/tech-post',
      domain: 'medium.com',
      pinned: false,
      isPrivate: false,
      collectionIds: [],
      lastActiveMinutesAgo: 95
    }
  ];

  describe('Protected Tab Rules (PRD Epic 4.4)', () => {
    it('protects pinned tabs from automated operations', () => {
      const res = AutomationEngine.isTabProtected(candidateTabs[0], DEFAULT_PROTECTION_RULES);
      expect(res.isProtected).toBe(true);
      expect(res.reason).toContain('pinned');
    });

    it('protects allowlisted domains', () => {
      const res = AutomationEngine.isTabProtected(candidateTabs[1], DEFAULT_PROTECTION_RULES);
      expect(res.isProtected).toBe(true);
      expect(res.reason).toContain("allowlisted");

      // Wildcard allowlist test (*.github.com protecting github.com and subdomains)
      const wildcardRules: AutomationProtectionRules = {
        ...DEFAULT_PROTECTION_RULES,
        allowlistedDomains: ['*.mycompany.com']
      };
      const rootTab: CandidateTab = {
        id: 't_root',
        title: 'Company Portal',
        url: 'https://mycompany.com',
        domain: 'mycompany.com'
      };
      const subTab: CandidateTab = {
        id: 't_sub',
        title: 'Internal Wiki',
        url: 'https://wiki.mycompany.com',
        domain: 'wiki.mycompany.com'
      };
      expect(AutomationEngine.isTabProtected(rootTab, wildcardRules).isProtected).toBe(true);
      expect(AutomationEngine.isTabProtected(subTab, wildcardRules).isProtected).toBe(true);
    });

    it('protects tabs in user-defined protected collections', () => {
      const res = AutomationEngine.isTabProtected(candidateTabs[2], DEFAULT_PROTECTION_RULES);
      expect(res.isProtected).toBe(true);
      expect(res.reason).toContain("protected collection 'work'");
    });

    it('protects private tabs from automatic capture and close', () => {
      const res = AutomationEngine.isTabProtected(candidateTabs[3], DEFAULT_PROTECTION_RULES);
      expect(res.isProtected).toBe(true);
      expect(res.reason).toContain('Private or incognito');
    });

    it('allows unprotected idle tabs to be targeted by automation', () => {
      const res = AutomationEngine.isTabProtected(candidateTabs[4], DEFAULT_PROTECTION_RULES);
      expect(res.isProtected).toBe(false);
    });
  });

  describe('Simulation / Preview Mode', () => {
    it('evaluates rules and returns preview breakdown without altering state', () => {
      const activeRule: AutomationRule = {
        id: 'rule_inactivity',
        name: 'Auto-vault inactive > 60m',
        trigger: 'inactivity',
        enabled: true,
        inactivityThresholdMinutes: 60,
        action: 'save_and_close'
      };

      const sim = AutomationEngine.simulate(candidateTabs, activeRule, DEFAULT_PROTECTION_RULES);

      // Only tab_idle_candidate is unprotected and inactive > 60m
      expect(sim.wouldSave.length).toBe(1);
      expect(sim.wouldSave[0].id).toBe('tab_idle_candidate');
      expect(sim.wouldClose.length).toBe(1);
      expect(sim.wouldClose[0].id).toBe('tab_idle_candidate');

      // 4 tabs must be protected
      expect(sim.protected.length).toBe(4);
    });

    it('targets only overflow tabs exceeding threshold for tab_count trigger', () => {
      const tabCountRule: AutomationRule = {
        id: 'rule_count',
        name: 'Vault when tabs exceed 3',
        trigger: 'tab_count',
        enabled: true,
        maxTabsThreshold: 3, // Candidate list has 5 tabs, 4 protected, 1 unprotected
        action: 'save_and_close'
      };

      // Create a list with 6 tabs (all unprotected) to clearly verify overflow count calculation
      const manyTabs: CandidateTab[] = [
        { id: 't1', title: 'T1', url: 'https://ex1.com', domain: 'ex1.com', lastActiveMinutesAgo: 10 },
        { id: 't2', title: 'T2', url: 'https://ex2.com', domain: 'ex2.com', lastActiveMinutesAgo: 100 }, // Oldest
        { id: 't3', title: 'T3', url: 'https://ex3.com', domain: 'ex3.com', lastActiveMinutesAgo: 80 },  // 2nd oldest
        { id: 't4', title: 'T4', url: 'https://ex4.com', domain: 'ex4.com', lastActiveMinutesAgo: 20 },
        { id: 't5', title: 'T5', url: 'https://ex5.com', domain: 'ex5.com', lastActiveMinutesAgo: 5 }
      ];

      // Total 5 tabs, threshold 3 -> overflow is 2 tabs!
      const sim = AutomationEngine.simulate(manyTabs, tabCountRule, {
        protectPinnedTabs: false,
        allowlistedDomains: [],
        protectedCollectionIds: [],
        excludePrivateTabs: false
      });

      // Exactly 2 overflow tabs should be targeted for save and close
      expect(sim.wouldSave.length).toBe(2);
      expect(sim.wouldClose.length).toBe(2);
      // The 2 targeted tabs must be the least active ones (t2: 100m, t3: 80m)
      expect(sim.wouldSave.map(t => t.id)).toEqual(['t2', 't3']);
      // The remaining 3 tabs are kept
      expect(sim.skipped.length).toBe(3);
    });

    it('skips all tabs when rule is disabled', () => {
      const disabledRule: AutomationRule = {
        id: 'rule_disabled',
        name: 'Disabled rule',
        trigger: 'inactivity',
        enabled: false,
        action: 'save_and_close'
      };

      const sim = AutomationEngine.simulate(candidateTabs, disabledRule, DEFAULT_PROTECTION_RULES);
      expect(sim.wouldSave.length).toBe(0);
      expect(sim.wouldClose.length).toBe(0);
      expect(sim.skipped.length).toBe(candidateTabs.length);
    });
  });

  describe('Verified Save Guarantee (PRD Acceptance Criteria)', () => {
    it('only closes tabs after verified successful save', async () => {
      const engine = new AutomationEngine();
      const rule: AutomationRule = {
        id: 'rule_test',
        name: 'Save and Close Test',
        trigger: 'inactivity',
        enabled: true,
        inactivityThresholdMinutes: 60,
        action: 'save_and_close'
      };

      const mockSaveTabs = vi.fn().mockResolvedValue(['tab_idle_candidate']);
      const mockCloseTabs = vi.fn().mockResolvedValue(undefined);

      const result = await engine.execute(
        candidateTabs,
        rule,
        DEFAULT_PROTECTION_RULES,
        { saveTabs: mockSaveTabs, closeTabs: mockCloseTabs }
      );

      expect(mockSaveTabs).toHaveBeenCalledTimes(1);
      expect(mockCloseTabs).toHaveBeenCalledWith(['tab_idle_candidate']);
      expect(result.savedCount).toBe(1);
      expect(result.closedCount).toBe(1);
    });

    it('NEVER closes tabs if the save operation fails', async () => {
      const engine = new AutomationEngine();
      const rule: AutomationRule = {
        id: 'rule_test_fail',
        name: 'Save and Close Test Fail',
        trigger: 'inactivity',
        enabled: true,
        inactivityThresholdMinutes: 60,
        action: 'save_and_close'
      };

      // Simulate save failure
      const mockSaveTabs = vi.fn().mockRejectedValue(new Error('Disk full during save'));
      const mockCloseTabs = vi.fn();

      const result = await engine.execute(
        candidateTabs,
        rule,
        DEFAULT_PROTECTION_RULES,
        { saveTabs: mockSaveTabs, closeTabs: mockCloseTabs }
      );

      // closeTabs must NOT be called! Source tabs remain open!
      expect(mockCloseTabs).not.toHaveBeenCalled();
      expect(result.savedCount).toBe(0);
      expect(result.closedCount).toBe(0);

      // Audit log records the failure
      const history = engine.getAuditHistory();
      const failedEntry = history.find(e => e.action === 'save' && e.status === 'failed');
      expect(failedEntry).toBeDefined();
      expect(failedEntry?.reason).toContain('Disk full during save');
    });
  });

  describe('Audit History & Pause Controls', () => {
    it('records structured audit history and exports JSON', async () => {
      const engine = new AutomationEngine();
      const rule: AutomationRule = {
        id: 'rule_audit',
        name: 'Audit Test',
        trigger: 'inactivity',
        enabled: true,
        inactivityThresholdMinutes: 60,
        action: 'save_only'
      };

      await engine.execute(candidateTabs, rule, DEFAULT_PROTECTION_RULES, {
        saveTabs: vi.fn().mockResolvedValue(['tab_idle_candidate']),
        closeTabs: vi.fn()
      });

      const history = engine.getAuditHistory();
      expect(history.length).toBeGreaterThan(0);

      const exportedJson = engine.exportAuditHistoryJson();
      expect(typeof exportedJson).toBe('string');
      expect(exportedJson).toContain('tab_idle_candidate');

      engine.clearAuditHistory();
      expect(engine.getAuditHistory().length).toBe(0);
    });

    it('respects pause control and does not execute actions while paused', async () => {
      const engine = new AutomationEngine();
      engine.pause();
      expect(engine.isAutomationPaused()).toBe(true);

      const mockSave = vi.fn();
      const result = await engine.execute(candidateTabs, DEFAULT_AUTOMATION_RULES[0], DEFAULT_PROTECTION_RULES, {
        saveTabs: mockSave,
        closeTabs: vi.fn()
      });

      expect(mockSave).not.toHaveBeenCalled();
      expect(result.savedCount).toBe(0);

      engine.resume();
      expect(engine.isAutomationPaused()).toBe(false);
    });
  });
});
