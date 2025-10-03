import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import FileWatcher from "./src/services/fileWatcher.js";
import RuleEngine from "./src/services/ruleEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let fileWatcher;
let ruleEngine;

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

	// Initialize file watcher
	fileWatcher = new FileWatcher();

	// When file detected, process it through rule engine
	fileWatcher.addListener((fileInfo) => {
		mainWindow.webContents.send("file-event", fileInfo);

		// Process file through rule engine
		const actions = ruleEngine.processFile(fileInfo);

		// If rules matched, send actions to renderer
		if (actions.length > 0) {
			actions.forEach((action) => {
				mainWindow.webContents.send("rule-action", action);
			});
		}
	});
}

// IPC Handlers for file watching
ipcMain.handle("start-watching", async (event, folderPath) => {
	try {
		const watchPath = folderPath || FileWatcher.getDownloadsPath();
		fileWatcher.start(watchPath);
		return { success: true, path: watchPath };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle("stop-watching", async () => {
	fileWatcher.stop();
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
