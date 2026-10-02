import { AutomationRule } from '../models/types';
import { localDb } from '../../data/local/database';

const RULES_STORAGE_KEY = 'avenzaq_automation_rules';

export class AutomationService {
  private static getStoredRules(): AutomationRule[] {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (!raw) {
      const defaultRules: AutomationRule[] = [
        {
          id: 'rule_01',
          name: 'Daily Content Generation',
          frequency: 'Daily',
          time: '10:00 AM',
          action: 'Generate Content',
          isEnabled: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'rule_02',
          name: 'Auto-Schedule Approved Posts',
          frequency: 'Realtime',
          time: 'Immediate',
          action: 'Move to Scheduled',
          isEnabled: true,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(defaultRules));
      return defaultRules;
    }
    return JSON.parse(raw);
  }

  private static saveRules(rules: AutomationRule[]): void {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  }

  public getRules(): AutomationRule[] {
    return AutomationService.getStoredRules();
  }

  public createRule(name: string, frequency: string, time: string, action: string): AutomationRule {
    const rules = AutomationService.getStoredRules();
    const newRule: AutomationRule = {
      id: `rule_${Date.now()}`,
      name,
      frequency,
      time,
      action,
      isEnabled: true,
      createdAt: new Date().toISOString()
    };
    const updated = [...rules, newRule];
    AutomationService.saveRules(updated);
    localDb.logActivity('automation_triggered', 'Automation Rule Created', `Created local rule "${name}".`);
    return newRule;
  }

  public updateRule(id: string, data: Partial<AutomationRule>): AutomationRule | null {
    const rules = AutomationService.getStoredRules();
    let updatedRule: AutomationRule | null = null;
    const updated = rules.map(r => {
      if (r.id === id) {
        updatedRule = { ...r, ...data };
        return updatedRule;
      }
      return r;
    });
    AutomationService.saveRules(updated);
    return updatedRule;
  }

  public deleteRule(id: string): void {
    const rules = AutomationService.getStoredRules();
    const updated = rules.filter(r => r.id !== id);
    AutomationService.saveRules(updated);
  }

  public enableRule(id: string): void {
    this.updateRule(id, { isEnabled: true });
    localDb.logActivity('automation_triggered', 'Automation Enabled', `Local rule enabled.`);
  }

  public disableRule(id: string): void {
    this.updateRule(id, { isEnabled: false });
    localDb.logActivity('automation_triggered', 'Automation Disabled', `Local rule disabled.`);
  }

  public executeDueRules(): { executedCount: number; message: string } {
    const rules = this.getRules().filter(r => r.isEnabled);
    if (rules.length === 0) {
      return { executedCount: 0, message: 'No active local rules to run.' };
    }

    localDb.logActivity('automation_triggered', 'Local Rules Executed', `Ran ${rules.length} active automation rules.`);
    return { executedCount: rules.length, message: `Successfully executed ${rules.length} local rules.` };
  }
}

export const automationService = new AutomationService();
