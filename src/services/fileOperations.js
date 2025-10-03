import fs from 'fs/promises';
import path from 'path';

class FileOperations {
  
  // Move a file to target directory
  static async moveFile(sourcePath, targetDir) {
    try {
      // Ensure target directory exists
      await fs.mkdir(targetDir, { recursive: true });
      
      // Get filename from source path
      const fileName = path.basename(sourcePath);
      const targetPath = path.join(targetDir, fileName);
      
      // Check if file already exists at target
      const targetExists = await this.fileExists(targetPath);
      
      if (targetExists) {
        // If exists, add timestamp to filename to avoid overwrite
        const timestamp = Date.now();
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        const newFileName = `${nameWithoutExt}_${timestamp}${ext}`;
        const newTargetPath = path.join(targetDir, newFileName);
        
        await fs.rename(sourcePath, newTargetPath);
        console.log(`✅ Moved (renamed): ${fileName} → ${newFileName}`);
        
        return {
          success: true,
          sourcePath,
          targetPath: newTargetPath,
          renamed: true,
          newName: newFileName
        };
      }
      
      // Move the file
      await fs.rename(sourcePath, targetPath);
      console.log(`✅ Moved: ${fileName} → ${targetDir}`);
      
      return {
        success: true,
        sourcePath,
        targetPath,
        renamed: false
      };
      
    } catch (error) {
      console.error('❌ Error moving file:', error);
      return {
        success: false,
        error: error.message,
        sourcePath
      };
    }
  }
  
  // Check if file exists
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  // Get file stats (size, created date, etc.)
  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      return null;
    }
  }
}

export default FileOperations;