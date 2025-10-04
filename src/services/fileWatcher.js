import { watch } from "chokidar";
import { basename, extname, join } from "path";
import { homedir } from "os";

class FileWatcher {
	constructor() {
		this.watcher = null;
		this.isWatching = false;
		this.listeners = [];
	}

	// Start watching a folder
	start(folderPath) {
		if (this.isWatching) {
			console.log("Already watching...");
			return;
		}

		console.log(`📁 Starting to watch: ${folderPath}`);

		this.watcher = watch(folderPath, {
			ignored: [
				/(^|[\/\\])\../, 
				/node_modules/,
				/\.git/,
				/dist/, 
				/build/,
				/coverage/, 
				/\.cache/, 
				/\.next/, 
				/\.nuxt/,
				/\.output/,
				/\.vercel/,
				/\.turbo/,
				/package-lock\.json$/,
				/yarn\.lock$/,
				/pnpm-lock\.yaml$/,
				/\.DS_Store$/,
			],
			persistent: true,
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 2000,
				pollInterval: 100,
			},
			// Key settings to reduce file watchers
			usePolling: false,
			ignorePermissionErrors: true, 
			atomic: true,
		});

		// File added
		this.watcher.on("add", (filePath) => {
			const fileInfo = {
				type: "added",
				path: filePath,
				name: basename(filePath),
				extension: extname(filePath),
				timestamp: new Date().toISOString(),
			};

			console.log("✅ File added:", fileInfo.name);
			this.notifyListeners(fileInfo);
		});

		// File changed
		this.watcher.on("change", (filePath) => {
			const fileInfo = {
				type: "changed",
				path: filePath,
				name: basename(filePath),
				extension: extname(filePath),
				timestamp: new Date().toISOString(),
			};

			console.log("📝 File changed:", fileInfo.name);
			this.notifyListeners(fileInfo);
		});

		// File removed
		this.watcher.on("unlink", (filePath) => {
			const fileInfo = {
				type: "removed",
				path: filePath,
				name: basename(filePath),
				extension: extname(filePath),
				timestamp: new Date().toISOString(),
			};

			console.log("🗑️ File removed:", fileInfo.name);
			this.notifyListeners(fileInfo);
		});

		// Watcher ready
		this.watcher.on("ready", () => {
			this.isWatching = true;
			console.log("👀 File watcher is ready!");
		});

		// Errors - with better error handling
		this.watcher.on("error", (error) => {
			// Only log EMFILE errors once to avoid spam
			if (error.code === 'EMFILE') {
				console.error("❌ Too many files open. Consider:");
				console.error("   1. Watching a more specific folder");
				console.error("   2. Increasing system file limits");
				console.error("   3. Adding more ignore patterns");
				this.stop(); // Stop watcher to prevent spam
			} else {
				console.error("❌ Watcher error:", error);
			}
		});
	}

	// Stop watching
	stop() {
		if (this.watcher) {
			this.watcher.close();
			this.isWatching = false;
			this.watcher = null;
			console.log("⏹️ File watcher stopped");
		}
	}

	// Add listener for file events
	addListener(callback) {
		this.listeners.push(callback);
	}

	// Notify all listeners
	notifyListeners(fileInfo) {
		this.listeners.forEach((listener) => listener(fileInfo));
	}

	// Get default Downloads folder path
	static getDownloadsPath() {
		return join(homedir(), "Downloads");
	}
}

export default FileWatcher;