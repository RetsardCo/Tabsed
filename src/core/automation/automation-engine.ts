import {
  AutomationRule,
  AutomationProtectionRules,
  AutomationAuditLogEntry,
  CandidateTab,
  AutomationSimulationResult
} from '../../ui/types';

function generateUuid(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'uuid_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export const DEFAULT_PROTECTION_RULES: AutomationProtectionRules = {
  protectPinnedTabs: true,
  allowlistedDomains: ['github.com', 'mail.google.com', 'docs.google.com', 'notion.so'],
  protectedCollectionIds: ['work', 'important'],
  excludePrivateTabs: true
};

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_inactivity_close',
    name: 'Auto-vault inactive tabs (> 60m)',
    trigger: 'inactivity',
    enabled: false, // Explicit opt-in required (PRD FR-120/121 & Epic 4.4)
    inactivityThresholdMinutes: 60,
    action: 'save_and_close'
  },
  {
    id: 'rule_high_tab_count',
    name: 'Vault when tabs exceed 30',
    trigger: 'tab_count',
    enabled: false,
    maxTabsThreshold: 30,
    action: 'save_only'
  }
];

export interface ExecutionCallbacks {
  saveTabs: (tabs: CandidateTab[]) => Promise<string[]> | string[]; // Returns saved tab IDs
  closeTabs: (tabIds: string[]) => Promise<void> | void;
}

export interface AutomationExecutionResult {
  savedCount: number;
  closedCount: number;
  protectedCount: number;
  skippedCount: number;
  auditEntries: AutomationAuditLogEntry[];
}

export class AutomationEngine {
  private auditLog: AutomationAuditLogEntry[] = [];
  private isPaused: boolean = false;

  constructor(initialAuditLog: AutomationAuditLogEntry[] = []) {
    this.auditLog = [...initialAuditLog];
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public isAutomationPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Checks if candidate tab is protected by protection rules (PRD Epic 4.4)
   */
  public static isTabProtected(
    tab: CandidateTab,
    protection: AutomationProtectionRules = DEFAULT_PROTECTION_RULES
  ): { isProtected: boolean; reason?: string } {
    // 1. Pinned tab protection
    if (tab.pinned && protection.protectPinnedTabs) {
      return { isProtected: true, reason: 'Tab is pinned' };
    }

    // 2. Allowlisted domain protection
    let rawDomain = tab.domain || '';
    if (!rawDomain && tab.url) {
      try {
        rawDomain = new URL(tab.url.includes('://') ? tab.url : `https://${tab.url}`).hostname;
      } catch {
        rawDomain = '';
      }
    }
    const tabDomain = rawDomain.toLowerCase().split(':')[0];

    for (const allowed of protection.allowlistedDomains) {
      let cleanAllowed = allowed.toLowerCase().trim();
      if (cleanAllowed.startsWith('*.')) {
        cleanAllowed = cleanAllowed.substring(2);
      }
      if (tabDomain === cleanAllowed || tabDomain.endsWith(`.${cleanAllowed}`)) {
        return { isProtected: true, reason: `Domain '${rawDomain}' is allowlisted` };
      }
    }

    // 3. User-defined collection protection
    if (tab.collectionIds && tab.collectionIds.length > 0) {
      for (const colId of tab.collectionIds) {
        if (protection.protectedCollectionIds.includes(colId)) {
          return { isProtected: true, reason: `Belongs to protected collection '${colId}'` };
        }
      }
    }

    // 4. Private tab protection
    if (tab.isPrivate && protection.excludePrivateTabs) {
      return { isProtected: true, reason: 'Private or incognito tab excluded by default' };
    }

    return { isProtected: false };
  }

  /**
   * Preview / Simulation mode: evaluates rule without executing any save or close actions (PRD Epic 4.4)
   */
  public static simulate(
    candidateTabs: CandidateTab[],
    rule: AutomationRule,
    protection: AutomationProtectionRules = DEFAULT_PROTECTION_RULES
  ): AutomationSimulationResult {
    const wouldSave: CandidateTab[] = [];
    const wouldClose: CandidateTab[] = [];
    const protectedList: { tab: CandidateTab; reason: string }[] = [];
    const skippedList: { tab: CandidateTab; reason: string }[] = [];

    // Check if rule is enabled
    if (!rule.enabled) {
      for (const tab of candidateTabs) {
        skippedList.push({ tab, reason: `Rule '${rule.name}' is disabled` });
      }
      return {
        rule,
        wouldSave,
        wouldClose,
        protected: protectedList,
        skipped: skippedList
      };
    }

    // Special handling for tab_count trigger: only overflow tabs beyond threshold are targeted
    if (rule.trigger === 'tab_count') {
      const threshold = rule.maxTabsThreshold ?? 30;
      const unprotectedCandidates: CandidateTab[] = [];

      for (const tab of candidateTabs) {
        const protectionResult = this.isTabProtected(tab, protection);
        if (protectionResult.isProtected) {
          protectedList.push({ tab, reason: protectionResult.reason || 'Protected by rule' });
        } else {
          unprotectedCandidates.push(tab);
        }
      }

      if (candidateTabs.length > threshold) {
        const overflowCount = candidateTabs.length - threshold;
        // Sort unprotected tabs by inactivity (highest inactive minutes first)
        const sorted = [...unprotectedCandidates].sort(
          (a, b) => (b.lastActiveMinutesAgo ?? 0) - (a.lastActiveMinutesAgo ?? 0)
        );

        const targetTabs = sorted.slice(0, overflowCount);
        const keptTabs = sorted.slice(overflowCount);

        for (const tab of targetTabs) {
          wouldSave.push(tab);
          if (rule.action === 'save_and_close') {
            wouldClose.push(tab);
          }
        }

        for (const tab of keptTabs) {
          skippedList.push({ tab, reason: `Within tab threshold (${threshold})` });
        }
      } else {
        for (const tab of unprotectedCandidates) {
          skippedList.push({ tab, reason: `Total tab count ${candidateTabs.length} <= ${threshold}` });
        }
      }

      return {
        rule,
        wouldSave,
        wouldClose,
        protected: protectedList,
        skipped: skippedList
      };
    }

    for (const tab of candidateTabs) {
      // Protection check
      const protectionResult = this.isTabProtected(tab, protection);
      if (protectionResult.isProtected) {
        protectedList.push({ tab, reason: protectionResult.reason || 'Protected by rule' });
        continue;
      }

      // Trigger condition check
      let matchesTrigger = false;

      if (rule.trigger === 'inactivity') {
        const threshold = rule.inactivityThresholdMinutes ?? 60;
        const minutesAgo = tab.lastActiveMinutesAgo ?? 0;
        if (minutesAgo >= threshold) {
          matchesTrigger = true;
        } else {
          skippedList.push({ tab, reason: `Active recently (${minutesAgo}m < ${threshold}m)` });
        }
      } else {
        matchesTrigger = true;
      }

      if (matchesTrigger) {
        wouldSave.push(tab);
        if (rule.action === 'save_and_close') {
          wouldClose.push(tab);
        }
      }
    }

    return {
      rule,
      wouldSave,
      wouldClose,
      protected: protectedList,
      skipped: skippedList
    };
  }

  /**
   * Executes automation with verified save guarantee:
   * Source tabs are ONLY closed if the save operation was verified and committed! (PRD Epic 4.4 & Acceptance Criteria)
   */
  public async execute(
    candidateTabs: CandidateTab[],
    rule: AutomationRule,
    protection: AutomationProtectionRules,
    callbacks: ExecutionCallbacks
  ): Promise<AutomationExecutionResult> {
    if (this.isPaused) {
      return {
        savedCount: 0,
        closedCount: 0,
        protectedCount: 0,
        skippedCount: candidateTabs.length,
        auditEntries: []
      };
    }

    const simulation = AutomationEngine.simulate(candidateTabs, rule, protection);
    const newAuditEntries: AutomationAuditLogEntry[] = [];

    // Record protected items in audit
    for (const item of simulation.protected) {
      const entry: AutomationAuditLogEntry = {
        id: generateUuid(),
        timestamp: new Date().toISOString(),
        ruleId: rule.id,
        ruleName: rule.name,
        action: 'protect',
        tabId: item.tab.id,
        tabUrl: item.tab.url,
        tabTitle: item.tab.title,
        status: 'skipped',
        reason: item.reason
      };
      newAuditEntries.push(entry);
      this.auditLog.push(entry);
    }

    if (simulation.wouldSave.length === 0) {
      return {
        savedCount: 0,
        closedCount: 0,
        protectedCount: simulation.protected.length,
        skippedCount: simulation.skipped.length,
        auditEntries: newAuditEntries
      };
    }

    // Step 1: Save eligible tabs
    let successfullySavedTabIds: string[] = [];
    try {
      const saveResult = await callbacks.saveTabs(simulation.wouldSave);
      successfullySavedTabIds = Array.isArray(saveResult) ? saveResult : simulation.wouldSave.map(t => t.id);

      for (const tab of simulation.wouldSave) {
        const isSaved = successfullySavedTabIds.includes(tab.id);
        const entry: AutomationAuditLogEntry = {
          id: generateUuid(),
          timestamp: new Date().toISOString(),
          ruleId: rule.id,
          ruleName: rule.name,
          action: 'save',
          tabId: tab.id,
          tabUrl: tab.url,
          tabTitle: tab.title,
          status: isSaved ? 'success' : 'failed',
          reason: isSaved ? 'Successfully saved to vault' : 'Save operation failed or unconfirmed'
        };
        newAuditEntries.push(entry);
        this.auditLog.push(entry);
      }
    } catch (saveError: any) {
      // Entire save operation failed: do NOT close any tabs!
      for (const tab of simulation.wouldSave) {
        const entry: AutomationAuditLogEntry = {
          id: generateUuid(),
          timestamp: new Date().toISOString(),
          ruleId: rule.id,
          ruleName: rule.name,
          action: 'save',
          tabId: tab.id,
          tabUrl: tab.url,
          tabTitle: tab.title,
          status: 'failed',
          reason: `Save failed: ${saveError.message}`
        };
        newAuditEntries.push(entry);
        this.auditLog.push(entry);
      }
      return {
        savedCount: 0,
        closedCount: 0,
        protectedCount: simulation.protected.length,
        skippedCount: simulation.skipped.length,
        auditEntries: newAuditEntries
      };
    }

    // Step 2: Automatic close ONLY for verified saved tabs!
    let closedCount = 0;
    if (rule.action === 'save_and_close') {
      const tabsToClose = simulation.wouldClose.filter(t => successfullySavedTabIds.includes(t.id));
      const tabIdsToClose = tabsToClose.map(t => t.id);

      if (tabIdsToClose.length > 0) {
        try {
          await callbacks.closeTabs(tabIdsToClose);
          closedCount = tabIdsToClose.length;

          for (const tab of tabsToClose) {
            const entry: AutomationAuditLogEntry = {
              id: generateUuid(),
              timestamp: new Date().toISOString(),
              ruleId: rule.id,
              ruleName: rule.name,
              action: 'close',
              tabId: tab.id,
              tabUrl: tab.url,
              tabTitle: tab.title,
              status: 'success',
              reason: 'Closed after verified save'
            };
            newAuditEntries.push(entry);
            this.auditLog.push(entry);
          }
        } catch (closeError: any) {
          for (const tab of tabsToClose) {
            const entry: AutomationAuditLogEntry = {
              id: generateUuid(),
              timestamp: new Date().toISOString(),
              ruleId: rule.id,
              ruleName: rule.name,
              action: 'close',
              tabId: tab.id,
              tabUrl: tab.url,
              tabTitle: tab.title,
              status: 'failed',
              reason: `Close failed: ${closeError.message}`
            };
            newAuditEntries.push(entry);
            this.auditLog.push(entry);
          }
        }
      }
    }

    return {
      savedCount: successfullySavedTabIds.length,
      closedCount,
      protectedCount: simulation.protected.length,
      skippedCount: simulation.skipped.length,
      auditEntries: newAuditEntries
    };
  }

  public getAuditHistory(): AutomationAuditLogEntry[] {
    return [...this.auditLog];
  }

  public clearAuditHistory(): void {
    this.auditLog = [];
  }

  public exportAuditHistoryJson(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }
}
