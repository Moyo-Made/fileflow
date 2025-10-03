import { useState } from 'react';
import Rules from './pages/Rules';
import ActivityLog from './pages/ActivityLog';
import Settings from './pages/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('rules');

  const renderPage = () => {
    switch(currentPage) {
      case 'rules': return <Rules />;
      case 'activity': return <ActivityLog />;
      case 'settings': return <Settings />;
      default: return <Rules />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '200px',
        background: '#2d3748',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>FileFlow</h2>
        
        <button
          onClick={() => setCurrentPage('rules')}
          style={{
            padding: '10px',
            background: currentPage === 'rules' ? '#4a5568' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: '4px'
          }}
        >
          📋 Rules
        </button>
        
        <button
          onClick={() => setCurrentPage('activity')}
          style={{
            padding: '10px',
            background: currentPage === 'activity' ? '#4a5568' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: '4px'
          }}
        >
          📊 Activity Log
        </button>
        
        <button
          onClick={() => setCurrentPage('settings')}
          style={{
            padding: '10px',
            background: currentPage === 'settings' ? '#4a5568' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: '4px'
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', background: '#f7fafc', overflow: 'auto' }}>
        {renderPage()}
      </div>
    </div>
  );
}

export default App;