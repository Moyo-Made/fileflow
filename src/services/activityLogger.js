import fs from 'fs/promises';
import path from 'path';

class ActivityLogger {
  constructor() {
    this.logFilePath = path.join(process.cwd(), 'activity-log.json');
    this.logs = [];
  }
  
  // Load existing logs
  async loadLogs() {
    try {
      const data = await fs.readFile(this.logFilePath, 'utf-8');
      this.logs = JSON.parse(data);
      console.log(`📊 Loaded ${this.logs.length} activity logs`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty array
        this.logs = [];
        await this.saveLogs();
      }
    }
  }
  
  // Save logs to file
  async saveLogs() {
    try {
      await fs.writeFile(
        this.logFilePath,
        JSON.stringify(this.logs, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  }
  
  // Log a file action
  async logAction(action) {
    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...action
    };
    
    this.logs.unshift(logEntry); // Add to beginning
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }
    
    await this.saveLogs();
    return logEntry;
  }
  
  // Get recent logs
  getRecentLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }
  
  // Get logs by date range
  getLogsByDateRange(startDate, endDate) {
    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }
}

export default ActivityLogger;