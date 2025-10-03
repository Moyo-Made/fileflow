import fs from 'fs/promises';
import path from 'path';

class RuleEngine {
  constructor() {
    this.rules = [];
    this.rulesFilePath = path.join(process.cwd(), 'rules.json');
  }

  // Load rules from JSON file
  async loadRules() {
    try {
      const data = await fs.readFile(this.rulesFilePath, 'utf-8');
      this.rules = JSON.parse(data);
      console.log(`📋 Loaded ${this.rules.length} rules`);
      return this.rules;
    } catch (error) {
      // If file doesn't exist, create empty rules file
      if (error.code === 'ENOENT') {
        console.log('📋 No rules file found, creating new one...');
        await this.saveRules([]);
        this.rules = [];
      } else {
        console.error('❌ Error loading rules:', error);
      }
      return [];
    }
  }

  // Save rules to JSON file
  async saveRules(rules) {
    try {
      await fs.writeFile(
        this.rulesFilePath, 
        JSON.stringify(rules, null, 2),
        'utf-8'
      );
      this.rules = rules;
      console.log('💾 Rules saved');
      return true;
    } catch (error) {
      console.error('❌ Error saving rules:', error);
      return false;
    }
  }

  // Add a new rule
  async addRule(rule) {
    const newRule = {
      id: `rule-${Date.now()}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      ...rule
    };
    
    this.rules.push(newRule);
    await this.saveRules(this.rules);
    return newRule;
  }

  // Check if a file matches a rule's condition
  matchesCondition(fileInfo, condition) {
    switch (condition.type) {
      case 'extension':
        // Match file extension (e.g., .pdf, .jpg)
        return fileInfo.extension.toLowerCase() === condition.value.toLowerCase();
      
      case 'name-contains':
        // Match if filename contains string (e.g., "invoice")
        return fileInfo.name.toLowerCase().includes(condition.value.toLowerCase());
      
      case 'name-starts-with':
        // Match if filename starts with string
        return fileInfo.name.toLowerCase().startsWith(condition.value.toLowerCase());
      
      case 'size-greater-than':
        // Match if file size > value (in MB)
        // We'll implement this when we add file stats
        return true;
      
      default:
        return false;
    }
  }

  // Find matching rules for a file
  findMatchingRules(fileInfo) {
    return this.rules.filter(rule => {
      // Skip disabled rules
      if (!rule.enabled) return false;
      
      // Check if file matches the rule's condition
      return this.matchesCondition(fileInfo, rule.condition);
    });
  }

  // Process a file event and return actions to take
  processFile(fileInfo) {
    const matchingRules = this.findMatchingRules(fileInfo);
    
    if (matchingRules.length === 0) {
      console.log(`ℹ️ No rules matched for: ${fileInfo.name}`);
      return [];
    }

    // For now, we'll just use the first matching rule
    // Later we can add priority/conflict resolution
    const rule = matchingRules[0];
    
    console.log(`✅ Rule matched: "${rule.name}" for file: ${fileInfo.name}`);
    
    return [{
      rule: rule,
      fileInfo: fileInfo,
      action: rule.action,
      timestamp: new Date().toISOString()
    }];
  }

  // Get all rules
  getRules() {
    return this.rules;
  }

  // Delete a rule
  async deleteRule(ruleId) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    await this.saveRules(this.rules);
  }

  // Toggle rule enabled/disabled
  async toggleRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      await this.saveRules(this.rules);
    }
  }
}

export default RuleEngine;