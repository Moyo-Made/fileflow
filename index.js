import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import FileWatcher from "./src/services/fileWatcher.js";
import RuleEngine from "./src/services/ruleEngine.js";
import FileOperations from "./src/services/fileOperations.js";
import ActivityLogger from "./src/services/activityLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let fileWatcher;
let ruleEngine;
let activityLogger;
let isWatching = false;
let currentWatchPath = null;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	if (process.argv.includes("--dev")) {
		mainWindow.loadURL("http://localhost:5173");
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
	}

	// Initialize rule engine
	ruleEngine = new RuleEngine();
	ruleEngine.loadRules();

	// Initialize activity logger
	activityLogger = new ActivityLogger();
	activityLogger.loadLogs();

	// Initialize file watcher
	fileWatcher = new FileWatcher();

	// Track files being processed to avoid double-move
	const processingFiles = new Set();

	// When file detected, process it through rule engine
	fileWatcher.addListener(async (fileInfo) => {
		mainWindow.webContents.send("file-event", fileInfo);

		// Ignore 'removed' events (these happen after we move files)
		if (fileInfo.type === "removed") {
			console.log("⏭️ Ignoring removed event:", fileInfo.name);
			return;
		}

		// Check if already processing this file
		if (processingFiles.has(fileInfo.path)) {
			console.log("⏭️ Already processing:", fileInfo.name);
			return;
		}

		// Mark as processing
		processingFiles.add(fileInfo.path);

		// Process file through rule engine
		const actions = ruleEngine.processFile(fileInfo);

		// If rules matched, execute actions
		if (actions.length > 0) {
			for (const action of actions) {
				mainWindow.webContents.send("rule-action", action);

				if (action.action.type === "move") {
					const result = await FileOperations.moveFile(
						action.fileInfo.path,
						action.action.target
					);

					const logEntry = await activityLogger.logAction({
						type: "file-moved",
						fileName: action.fileInfo.name,
						sourcePath: result.sourcePath,
						targetPath: result.targetPath,
						ruleName: action.rule.name,
						success: result.success,
						error: result.error,
						renamed: result.renamed,
						newName: result.newName,
					});

					mainWindow.webContents.send("action-completed", logEntry);

					if (result.success) {
						console.log(`🎉 Successfully moved: ${action.fileInfo.name}`);
					} else {
						console.error(
							`❌ Failed to move: ${action.fileInfo.name}`,
							result.error
						);
					}
				}
			}
		}

		// Remove from processing after 5 seconds (cleanup)
		setTimeout(() => {
			processingFiles.delete(fileInfo.path);
		}, 5000);
	});

	// Auto-start watching Downloads folder
	const downloadsPath = FileWatcher.getDownloadsPath();
	fileWatcher.start(downloadsPath);
	isWatching = true;
	currentWatchPath = downloadsPath;
	console.log(`🚀 Auto-started watching: ${downloadsPath}`);
}

// IPC Handlers for file watching
ipcMain.handle("start-watching", async (event, folderPath) => {
	try {
		const watchPath = folderPath || FileWatcher.getDownloadsPath();
		fileWatcher.start(watchPath);
		isWatching = true;
		currentWatchPath = watchPath;
		return { success: true, path: watchPath };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle("stop-watching", async () => {
	fileWatcher.stop();
	isWatching = false;
	return { success: true };
});

ipcMain.handle("get-downloads-path", async () => {
	return FileWatcher.getDownloadsPath();
});

// IPC Handlers for rules
ipcMain.handle("get-rules", async () => {
	return ruleEngine.getRules();
});

ipcMain.handle("add-rule", async (event, rule) => {
	return await ruleEngine.addRule(rule);
});

ipcMain.handle("delete-rule", async (event, ruleId) => {
	await ruleEngine.deleteRule(ruleId);
	return { success: true };
});

ipcMain.handle("toggle-rule", async (event, ruleId) => {
	await ruleEngine.toggleRule(ruleId);
	return { success: true };
});

ipcMain.handle("get-activity-logs", async () => {
	return activityLogger.getRecentLogs();
});

// IPC Handler for folder selection
ipcMain.handle("select-folder", async () => {
	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ["openDirectory", "createDirectory"],
		title: "Select Target Folder",
	});

	if (result.canceled) {
		return null;
	}

	return result.filePaths[0];
});

// IPC Handlers for Settings
ipcMain.handle("get-watch-status", async () => {
	return {
		isWatching: isWatching,
		watchPath: currentWatchPath || FileWatcher.getDownloadsPath(),
	};
});

ipcMain.handle("change-watch-folder", async (event, newPath) => {
	try {
		// Stop current watcher
		if (isWatching) {
			fileWatcher.stop();
		}

		// Start watching new path
		fileWatcher.start(newPath);
		isWatching = true;
		currentWatchPath = newPath;

		return { success: true, path: newPath };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle("clear-activity-logs", async () => {
	await activityLogger.clearLogs();
	return { success: true };
});

ipcMain.handle("get-app-version", async () => {
	return app.getVersion();
});

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (fileWatcher) {
		fileWatcher.stop();
	}
	if (process.platform !== "darwin") {
		app.quit();
	}
});
