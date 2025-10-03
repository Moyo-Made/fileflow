function ActivityLog() {
  return (
    <div>
      <h1>Activity Log</h1>
      <p>Track all file operations here.</p>
      <div style={{ 
        padding: '20px', 
        background: 'white', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <p>No activity yet...</p>
      </div>
    </div>
  );
}

export default ActivityLog;