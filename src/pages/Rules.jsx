import { useState, useEffect } from 'react';
import os from 'os';
import path from 'path';

const { ipcRenderer } = window.require('electron');

function Rules() {
  const [rules, setRules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [ruleName, setRuleName] = useState('');
  const [conditionType, setConditionType] = useState('extension');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState('move');
  const [targetFolder, setTargetFolder] = useState('');

  // Load rules on mount
  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const loadedRules = await ipcRenderer.invoke('get-rules');
    setRules(loadedRules);
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    
    const newRule = {
      name: ruleName,
      condition: {
        type: conditionType,
        value: conditionValue
      },
      action: {
        type: actionType,
        target: targetFolder
      }
    };

    await ipcRenderer.invoke('add-rule', newRule);
    
    // Reset form
    setRuleName('');
    setConditionValue('');
    setTargetFolder('');
    setShowForm(false);
    
    // Reload rules
    loadRules();
  };

  const handleDeleteRule = async (ruleId) => {
    await ipcRenderer.invoke('delete-rule', ruleId);
    loadRules();
  };

  const handleToggleRule = async (ruleId) => {
    await ipcRenderer.invoke('toggle-rule', ruleId);
    loadRules();
  };

  const suggestFolder = (type) => {
    const home = os.homedir();
    switch(type) {
      case '.pdf': return path.join(home, 'Documents', 'PDFs');
      case '.jpg': 
      case '.png': 
      case '.jpeg': return path.join(home, 'Pictures');
      case '.zip':
      case '.dmg': return path.join(home, 'Downloads', 'Archives');
      default: return path.join(home, 'Documents');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Rules</h1>
          <p>Define how FileFlow organizes your files</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Rule'}
        </button>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div style={{ 
          padding: '20px', 
          background: 'white', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Create New Rule</h3>
          <form onSubmit={handleAddRule}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Rule Name
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g., Move PDFs to Documents"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                When file...
              </label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  marginRight: '10px'
                }}
              >
                <option value="extension">has extension</option>
                <option value="name-contains">name contains</option>
                <option value="name-starts-with">name starts with</option>
              </select>
              <input
                type="text"
                value={conditionValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setConditionValue(val);
                  // Auto-suggest folder based on extension
                  if (conditionType === 'extension' && val.startsWith('.')) {
                    setTargetFolder(suggestFolder(val));
                  }
                }}
                placeholder={conditionType === 'extension' ? '.pdf' : 'invoice'}
                required
                style={{
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  width: '200px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Move to folder
              </label>
              <input
                type="text"
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                placeholder="/Users/yourname/Documents/PDFs"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
              <small style={{ color: '#718096' }}>
                💡 Tip: Type the full path where files should be moved
              </small>
            </div>

            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#48bb78',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Create Rule
            </button>
          </form>
        </div>
      )}

      {/* Rules List */}
      <div style={{ 
        padding: '20px', 
        background: 'white', 
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Active Rules ({rules.length})</h3>

        {rules.length === 0 ? (
          <p style={{ color: '#a0aec0' }}>
            No rules yet. Create your first rule to start organizing files!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rules.map(rule => (
              <div
                key={rule.id}
                style={{
                  padding: '15px',
                  background: rule.enabled ? '#f7fafc' : '#fef5e7',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {rule.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#718096' }}>
                    When <strong>{rule.condition.type}</strong> is <strong>{rule.condition.value}</strong>
                    {' → '}
                    Move to <code style={{ background: '#edf2f7', padding: '2px 6px', borderRadius: '3px' }}>
                      {rule.action.target}
                    </code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    style={{
                      padding: '6px 12px',
                      background: rule.enabled ? '#48bb78' : '#a0aec0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {rule.enabled ? '✓ Enabled' : '○ Disabled'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Rules;